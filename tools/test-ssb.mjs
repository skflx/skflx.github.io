#!/usr/bin/env node
/* =============================================================
   test-ssb.mjs — SSB behavior tests (docs/ssb.md 9), phase 2: the
   variant lab.

   Drives ssb.html in headless Chromium (software WebGL, smoke-lib.mjs) and
   reads the scene back through the read-only test window window.__ssb.lab
   (js/ssb/mode-lab.js): part names, graph ids, hazards, RAS bounding boxes,
   the computed frontal pathway, and a pixel where a click picks a part.

   Pins:
   - each diorama loads; every part is named <graph id>.<side> and its id,
     and every hazard id it carries, resolve in the knowledge graph;
   - presets agree with the graph's own classification criteria, and the
     preset buttons carry the graph's class labels;
   - ethmoid roof: Keros I -> III raises the lateral lamella by exactly the
     preset difference (per side); asymmetry lowers the left roof; the AEA
     drop follows its parameter; a supraorbital cell pushes the AEA down by
     the graph's mean drop (m.aea-mesentery-drop);
   - frontal recess: every IFAC rule the graph states, reproduced by the
     computed pathway under all three modelled uncinate attachments —
     anterior cells push it posteriorly, suprabullar cells anteriorly, a
     frontal septal cell laterally, the supraorbital cell lies posterolateral
     to it, and the uncinate attachment decides medial (middle meatus) vs
     lateral (infundibulum) drainage; and the same through the UI checkboxes;
   - clicking a part selects its graph entity (panel + URL follow);
   - a hostile #lab= is whitelisted and clamped, never markup;
   - each diorama opens on its lesson's view (ethmoid roof coronal, frontal
     recess sagittal) and the view buttons cut between the standard views;
   - on desktop the docked controls never cover the canvas and collapse to
     a rail; phones get the controls in the bottom sheet;
   - reduced motion stops the particles;
   - zero real console errors throughout.

   Usage:  node tools/test-ssb.mjs [--base <url>] [--headed] [--shots <dir>]
           --shots writes desktop + phone screenshots of each diorama.
   Exits nonzero on any failed check.
   ============================================================= */
import path from 'path';
import { startServer, launchBrowser, collectErrors } from './smoke-lib.mjs';
import { validate, contentFiles } from './ssb-content.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const BASE = opt('--base', null);
const HEADED = args.includes('--headed');
const SHOTS = opt('--shots', null);

const results = [];
function check(name, cond, detail) { results.push({ name, ok: !!cond, detail }); }
const near = (a, b, tol = 0.05) => Math.abs(a - b) <= tol;
const r2 = (v) => Math.round(v * 100) / 100;

const { index: GRAPH } = validate(contentFiles());
const entity = (id) => (GRAPH.get(id) || {}).entity;

/* ---------------- page helpers ---------------- */

const allErrors = [];

async function open(browser, base, hash, { viewport = { width: 1280, height: 800 }, reducedMotion = 'no-preference', waitLab = true } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion });
  const page = await context.newPage();
  const errors = collectErrors(page);
  allErrors.push(errors);
  await page.goto(`${base}/ssb.html${hash}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForFunction(() => document.querySelectorAll('#ssb-tree button[data-id]').length > 0, null, { timeout: 20000 });
  if (waitLab) await page.waitForFunction(() => window.__ssb.lab && window.__ssb.lab.builds > 0, null, { timeout: 20000 });
  return { context, page, errors };
}

const builds = (page) => page.evaluate(() => (window.__ssb.lab ? window.__ssb.lab.builds : 0));

/* Run `fn`, then wait for the diorama to rebuild. */
async function act(page, fn) {
  const before = await builds(page);
  await fn();
  await page.waitForFunction((n) => window.__ssb.lab.builds > n, before, { timeout: 15000 });
}

const setHash = (page, hash) => act(page, () => page.evaluate((h) => { location.hash = h; }, hash));
const parts = (page) => page.evaluate(() => window.__ssb.lab.parts());
const part = async (page, name) => (await parts(page)).find((p) => p.name === name);
const height = (p) => p.box.max[2] - p.box.min[2];

/* Mean RAS coordinate `axis` of the pathway points with z in [lo, hi]. */
function meanIn(points, axis, lo, hi) {
  const pts = points.filter((p) => p[2] >= lo && p[2] <= hi);
  return pts.reduce((s, p) => s + p[axis], 0) / (pts.length || 1);
}
const AP = (path) => meanIn(path.points, 1, -12, 3);   /* recess + ostium: anteroposterior */
const ML = (path) => meanIn(path.points, 0, -3, 3);    /* ostium level: mediolateral (right side: +x lateral) */

/* ---------------- criteria parsing (the graph's own text) ---------------- */

/* "Olfactory fossa depth 1–3 mm." -> [1, 3]; "greater than 80°" -> (80, inf); "less than 45°" -> (-inf, 45) */
function criterionRange(text) {
  const range = text.match(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)/);
  if (range) return { lo: Number(range[1]), hi: Number(range[2]), closed: true };
  const gt = text.match(/greater than\s+(\d+(?:\.\d+)?)/i);
  if (gt) return { lo: Number(gt[1]), hi: Infinity, closed: false };
  const lt = text.match(/less than\s+(\d+(?:\.\d+)?)/i);
  if (lt) return { lo: -Infinity, hi: Number(lt[1]), closed: false };
  return null;
}
const inRange = (v, r) => (r.closed ? v >= r.lo && v <= r.hi : v > r.lo && v < r.hi);

/* ---------------- the suite ---------------- */

async function main() {
  let server = null;
  let base = BASE;
  if (!base) { server = await startServer(); base = server.origin; }
  const browser = await launchBrowser({ headed: HEADED });

  /* ===== 1. each diorama loads; parts resolve in the graph ===== */
  const REQUIRED = {
    'ethmoid-roof': ['s.cribriform-plate.R', 's.lateral-lamella.R', 's.lateral-lamella.L', 's.fovea-ethmoidalis.R', 's.crista-galli.M',
      's.lamina-papyracea.R', 's.anterior-ethmoid-cells.R', 's.middle-turbinate.R', 's.orbit.R', 's.olfactory-fossa.R', 's.anterior-ethmoidal-artery.R'],
    'frontal-recess': ['s.frontal-sinus.R', 's.frontal-ostium.R', 's.uncinate-process.R', 's.ethmoid-bulla.R', 's.middle-turbinate.R',
      's.lamina-papyracea.R', 's.fovea-ethmoidalis.R', 's.agger-nasi-cell.R'],
  };
  for (const name of Object.keys(REQUIRED)) {
    const { context, page } = await open(browser, base, `#lab=${name}`);
    const info = await page.evaluate(() => ({
      name: window.__ssb.lab.name,
      truth: document.getElementById('ssb-truth').textContent,
      truthShown: !document.getElementById('ssb-truth').hidden && document.getElementById('ssb-truth').offsetParent !== null,
      pressed: document.querySelector('#ssb-stage-mode [data-stage="lab"]').getAttribute('aria-pressed'),
    }));
    const ps = await parts(page);
    check(`${name}: loads and builds`, info.name === name && ps.length > 0, JSON.stringify(info));
    check(`${name}: "schematic — idealized" badge visible`, info.truthShown && /schematic — idealized/.test(info.truth), info.truth);
    check(`${name}: stage switch shows Lab`, info.pressed === 'true');
    const want = name === 'ethmoid-roof' ? 'coronal' : 'sagittal';
    check(`${name}: opens on the ${want} view`, (await page.evaluate(() => window.__ssb.lab.view)) === want);
    const geom = await page.evaluate(() => {
      const d = document.getElementById('ssb-lab-dock').getBoundingClientRect();
      const c = document.getElementById('ssb-canvas').getBoundingClientRect();
      return { dockRight: d.right, canvasLeft: c.left, canvasWidth: c.width };
    });
    check(`${name}: the docked controls never cover the canvas`, geom.canvasLeft >= geom.dockRight - 1 && geom.canvasWidth > 200, JSON.stringify(geom));
    const missing = REQUIRED[name].filter((n) => !ps.some((p) => p.name === n));
    check(`${name}: required parts present`, missing.length === 0, 'missing ' + missing.join(', '));
    const badName = ps.filter((p) => !/^(.+)\.(R|L|M)$/.test(p.name) || p.name.replace(/\.(R|L|M)$/, '') !== p.id);
    check(`${name}: every part is named <graph id>.<side>`, badName.length === 0, badName.map((p) => p.name).join(', '));
    const unknown = ps.filter((p) => !GRAPH.has(p.id));
    check(`${name}: every part id resolves in the graph`, unknown.length === 0, unknown.map((p) => p.id).join(', '));
    const badHaz = ps.flatMap((p) => p.hazards).filter((h) => !h.startsWith('h.') || !GRAPH.has(h));
    check(`${name}: every hazard id resolves to a graph hazard`, badHaz.length === 0, badHaz.join(', '));
    await context.close();
  }

  /* ===== 2. ethmoid roof ===== */
  {
    const { context, page } = await open(browser, base, '#lab=ethmoid-roof');
    const presets = await page.evaluate(() => window.__ssb.lab.presets);

    for (const cls of ['c.keros', 'c.gera']) {
      const e = entity(cls);
      const key = cls === 'c.keros' ? 'keros' : 'gera';
      for (const [code, p] of Object.entries(presets[cls])) {
        const c = e.classes.find((x) => String(x.code) === code);
        const range = c && criterionRange(c.criterion);
        check(`${cls} ${code}: preset ${key}=${p[key]} satisfies the graph's criterion "${c && c.criterion}"`, range && inRange(p[key], range));
      }
    }
    const labels = await page.$$eval('button[data-cls="c.keros"]', (bs) => bs.map((b) => [b.dataset.code, b.textContent]));
    check('preset buttons carry the graph class labels', labels.length === 3
      && labels.every(([code, text]) => text.includes(entity('c.keros').classes.find((c) => c.code === code).label)), JSON.stringify(labels));

    const lam = entity('h.lateral-lamella-perforation');
    const lamR = await part(page, 's.lateral-lamella.R');
    check('lateral lamella is a hazard site carrying the graph hazard aimed at it',
      lamR.hazards.includes('h.lateral-lamella-perforation') && lam.at === 's.lateral-lamella', JSON.stringify(lamR.hazards));
    check('the HUD names the hatched hazard in text', await page.evaluate(() => /Lateral lamella perforation/.test(document.getElementById('ssb-hud').textContent)));

    await act(page, () => page.click('button[data-cls="c.keros"][data-code="I"]'));
    const i = { R: await part(page, 's.lateral-lamella.R'), L: await part(page, 's.lateral-lamella.L'), fovR: await part(page, 's.fovea-ethmoidalis.R') };
    await act(page, () => page.click('button[data-cls="c.keros"][data-code="III"]'));
    const iii = { R: await part(page, 's.lateral-lamella.R'), L: await part(page, 's.lateral-lamella.L'), fovR: await part(page, 's.fovea-ethmoidalis.R') };
    const want = presets['c.keros'].III.keros - presets['c.keros'].I.keros;
    for (const side of ['R', 'L']) {
      const d = height(iii[side]) - height(i[side]);
      check(`Keros I -> III raises the ${side} lateral lamella by ${want} mm (scene: ${r2(d)} mm)`, near(d, want), `I ${r2(height(i[side]))}, III ${r2(height(iii[side]))}`);
    }
    check('the lamella rises exactly to the fovea (Keros III)', near(iii.R.box.max[2], iii.fovR.box.max[2], 0.01), `${iii.R.box.max[2]} vs ${iii.fovR.box.max[2]}`);
    check('Keros III is recorded in the URL', await page.evaluate(() => location.hash === '#lab=ethmoid-roof&keros=12'), await page.evaluate(() => location.hash));

    await setHash(page, '#lab=ethmoid-roof&keros=12&asym=3');
    const asymR = await part(page, 's.lateral-lamella.R');
    const asymL = await part(page, 's.lateral-lamella.L');
    check('asymmetry lowers the left roof: left lamella 3 mm shorter', near(height(asymR) - height(asymL), 3), `${r2(height(asymR))} vs ${r2(height(asymL))}`);

    await setHash(page, '#lab=ethmoid-roof&keros=12&aea=2');
    const canal2 = await part(page, 's.anterior-ethmoidal-canal.R');
    check('AEA at 2 mm hangs in a mesentery (variant part + transection hazard)',
      !!(await part(page, 'v.aea-in-mesentery.R')) && (await part(page, 's.anterior-ethmoidal-artery.R')).hazards.includes('h.aea-transection'));
    await setHash(page, '#lab=ethmoid-roof&keros=12&aea=6');
    const canal6 = await part(page, 's.anterior-ethmoidal-canal.R');
    check('the AEA canal drops exactly as its parameter (2 -> 6 mm)', near(canal2.box.min[2] - canal6.box.min[2], 4), r2(canal2.box.min[2] - canal6.box.min[2]));

    await setHash(page, '#lab=ethmoid-roof&keros=12');
    const inRoof = await part(page, 's.anterior-ethmoidal-canal.R');
    check('AEA in the roof: no mesentery, no transection hatch', !(await part(page, 'v.aea-in-mesentery.R'))
      && !(await part(page, 's.anterior-ethmoidal-artery.R')).hazards.length);
    await setHash(page, '#lab=ethmoid-roof&keros=12&soec=1');
    const withCell = await part(page, 's.anterior-ethmoidal-canal.R');
    const mean = entity('m.aea-mesentery-drop').value.mean;
    check(`a supraorbital cell pushes the AEA ${mean} mm below the roof (m.aea-mesentery-drop mean)`,
      near(inRoof.box.min[2] - withCell.box.min[2], mean) && !!(await part(page, 'v.supraorbital-ethmoid-cell.R')), r2(inRoof.box.min[2] - withCell.box.min[2]));

    /* views: a cut, the model untouched */
    const b0 = await builds(page);
    for (const v of ['axial', 'sagittal', 'oblique', 'coronal']) {
      await page.click(`#ssb-lab button[data-camera="${v}"]`);
      const got = await page.evaluate(() => ({ view: window.__ssb.lab.view, pressed: document.querySelector('#ssb-lab button[aria-pressed="true"][data-camera]').dataset.camera }));
      check(`view button ${v} cuts to that view`, got.view === v && got.pressed === v, JSON.stringify(got));
    }
    check('changing view does not rebuild the diorama', (await builds(page)) === b0);

    /* the dock collapses to a rail and gives the canvas the width */
    const wideBefore = await page.evaluate(() => document.getElementById('ssb-canvas').getBoundingClientRect().width);
    await page.click('#ssb-dock-toggle');
    await page.waitForTimeout(100);
    const railed = await page.evaluate(() => ({
      canvas: document.getElementById('ssb-canvas').getBoundingClientRect().width,
      dock: document.getElementById('ssb-lab-dock').getBoundingClientRect().width,
      expanded: document.getElementById('ssb-dock-toggle').getAttribute('aria-expanded'),
      hudOnStage: document.getElementById('ssb-hud').parentElement.id === 'ssb-stage',
    }));
    check('the dock collapses to a rail (canvas widens, readout stays on the stage)',
      railed.canvas > wideBefore + 150 && railed.dock < 60 && railed.expanded === 'false' && railed.hudOnStage, JSON.stringify(railed));
    await page.click('#ssb-dock-toggle');

    /* picking */
    await setHash(page, '#lab=ethmoid-roof&keros=12');
    const at = await page.evaluate(() => window.__ssb.lab.screenOf('s.lateral-lamella.R'));
    check('a pixel exists where the right lateral lamella is picked first', !!at);
    if (at) {
      await page.mouse.click(at.x, at.y);
      await page.waitForFunction(() => window.__ssb.selection === 's.lateral-lamella', null, { timeout: 5000 }).catch(() => {});
      const sel = await page.evaluate(() => ({ s: window.__ssb.selection, panel: !!document.querySelector('#ssb-panel-body [data-entity="s.lateral-lamella"]'), hash: location.hash }));
      check('clicking the lateral lamella selects s.lateral-lamella (panel + URL follow)', sel.s === 's.lateral-lamella' && sel.panel && /s=s\.lateral-lamella/.test(sel.hash), JSON.stringify(sel));
    }
    await context.close();
  }

  /* ===== 3. frontal recess: the computed pathway reproduces the IFAC rules ===== */
  {
    const { context, page } = await open(browser, base, '#lab=frontal-recess');
    const presets = await page.evaluate(() => window.__ssb.lab.presets);
    for (const cls of ['c.ifac', 'c.uncinate-superior-attachment']) {
      const codes = entity(cls).classes.map((c) => String(c.code));
      const bad = Object.keys(presets[cls]).filter((code) => !codes.includes(code));
      check(`${cls}: every preset code is a class in the graph`, bad.length === 0, bad.join(', '));
    }

    const OFF = 'anc=0';
    const pathFor = async (hash) => {
      const cur = await page.evaluate(() => location.hash);
      if (cur !== hash) await setHash(page, hash);
      return page.evaluate(() => ({ ...window.__ssb.lab.pathway, derived: window.__ssb.lab.derived }));
    };
    for (const u of [1, 5, 6]) {
      const tag = `uncinate ${u}`;
      const base0 = await pathFor(`#lab=frontal-recess&${OFF}&uncinate=${u}`);
      check(`${tag}: an open pathway exists with no cells`, base0.points && base0.points.length > 10 && !base0.blocked);
      const lateral = u !== 1;
      check(`${tag}: drains ${lateral ? 'lateral' : 'medial'} to the uncinate into the ${lateral ? 'infundibulum' : 'middle meatus'}`,
        base0.outlet === (lateral ? 'infundibulum' : 'middle-meatus')
        && (lateral ? base0.points.at(-1)[0] > base0.uncinateX : base0.points.at(-1)[0] < base0.uncinateX)
        && base0.id === (lateral ? 'pw.frontal-drainage-infundibular' : 'pw.frontal-drainage') && GRAPH.has(base0.id),
        `${base0.outlet}, end x ${base0.points.at(-1)[0]}, ${base0.id}`);
      for (const [cell, dir] of [['anc', -1], ['sac', -1], ['safc', -1], ['sbc', 1], ['sbfc', 1]]) {
        const p = await pathFor(`#lab=frontal-recess&${cell === 'anc' ? '' : OFF + '&'}${cell === 'anc' ? 'anc=1' : cell + '=1'}&uncinate=${u}`.replace('&&', '&'));
        const d = AP(p) - AP(base0);
        const word = dir < 0 ? 'posteriorly' : 'anteriorly';
        check(`${tag}: ${cell.toUpperCase()} pushes the pathway ${word} (${r2(d)} mm)`, !p.blocked && d * dir >= 0.5, `AP ${r2(AP(p))} vs ${r2(AP(base0))}`);
      }
      const fsc = await pathFor(`#lab=frontal-recess&${OFF}&fsc=1&uncinate=${u}`);
      check(`${tag}: FSC pushes the pathway laterally (${r2(ML(fsc) - ML(base0))} mm)`, !fsc.blocked && ML(fsc) - ML(base0) >= 0.5, `ML ${r2(ML(fsc))} vs ${r2(ML(base0))}`);
      const soec = await pathFor(`#lab=frontal-recess&${OFF}&soec=1&uncinate=${u}`);
      const cellC = soec.derived.cells.find((c) => c.key === 'soec').solid.c;
      const lvl = soec.points.filter((p) => Math.abs(p[2] - cellC[2]) <= 3);
      check(`${tag}: the pathway runs anterior and medial to the SOEC`, lvl.length > 0 && lvl.every((p) => p[1] > cellC[1] && p[0] < cellC[0]), JSON.stringify(cellC));
    }

    /* the spec's toggle, through the UI checkboxes */
    await setHash(page, `#lab=frontal-recess&${OFF}`);
    const none = await page.evaluate(() => window.__ssb.lab.pathway);
    await act(page, () => page.check('input[type="checkbox"][data-key="anc"]'));
    const withAnc = await page.evaluate(() => window.__ssb.lab.pathway);
    await act(page, () => page.uncheck('input[type="checkbox"][data-key="anc"]'));
    await act(page, () => page.check('input[type="checkbox"][data-key="sbfc"]'));
    const withSbfc = await page.evaluate(() => window.__ssb.lab.pathway);
    check(`UI: toggling the agger nasi cell moves the pathway posterior (${r2(AP(withAnc) - AP(none))} mm), the suprabullar frontal cell anterior (${r2(AP(withSbfc) - AP(none))} mm)`,
      AP(withAnc) < AP(none) && AP(withSbfc) > AP(none) && AP(withSbfc) - AP(withAnc) >= 1);
    check('UI: the pathway is rebuilt when cells change', JSON.stringify(withAnc.points) !== JSON.stringify(withSbfc.points));

    /* picking a cell and the pathway */
    await setHash(page, '#lab=frontal-recess');
    for (const [name, id] of [['s.agger-nasi-cell.R', 's.agger-nasi-cell'], ['pw.frontal-drainage.R', 'pw.frontal-drainage']]) {
      const at = await page.evaluate((n) => window.__ssb.lab.screenOf(n), name);
      if (at) {
        await page.mouse.click(at.x, at.y);
        await page.waitForFunction((want) => window.__ssb.selection === want, id, { timeout: 5000 }).catch(() => {});
      }
      check(`clicking ${name} selects ${id}`, at && (await page.evaluate(() => window.__ssb.selection)) === id, JSON.stringify(at));
    }
    await context.close();
  }

  /* ===== 4. hostile #lab= ===== */
  {
    const hostile = '#lab=ethmoid-roof&keros=999&gera=-1e9&asym=' + encodeURIComponent('<img src=x id=pwn onerror=window.__pwned=1>')
      + '&aea=1e400&soec=7&c.gera=' + encodeURIComponent('<b>') + '&bogus=1';
    const { context, page } = await open(browser, base, hostile);
    const got = await page.evaluate(() => ({ params: window.__ssb.lab.params, hash: location.hash, pwn: !!document.getElementById('pwn') || !!window.__pwned }));
    check('hostile #lab= values are clamped (keros 16, gera 25) or dropped to defaults (asym 0, aea 0), toggles clamp to 1',
      got.params.keros === 16 && got.params.gera === 25 && got.params.asym === 0 && got.params.aea === 0 && got.params.soec === 1, JSON.stringify(got.params));
    check('hostile #lab= never becomes markup and is rewritten canonically', !got.pwn && got.hash === '#lab=ethmoid-roof&keros=16&gera=25&soec=1', got.hash);
    await setHash(page, '#lab=ethmoid-roof&keros=12.3&gera=62.4');
    const snap = await page.evaluate(() => window.__ssb.lab.params);
    check('values snap to the parameter step', snap.keros === 12.5 && snap.gera === 62.5, JSON.stringify(snap));
    await context.close();

    const bad = await open(browser, base, '#lab=' + encodeURIComponent('<img src=x id=pwn2 onerror=window.__pwned=1>') + '&keros=5', { waitLab: false });
    await bad.page.waitForTimeout(500);
    const g = await bad.page.evaluate(() => ({ lab: window.__ssb.lab ? window.__ssb.lab.name : null, hash: location.hash, pwn: !!document.getElementById('pwn2') || !!window.__pwned }));
    check('an unknown diorama name is ignored (specimen stage, empty hash)', g.lab === null && g.hash === '' && !g.pwn, JSON.stringify(g));
    await bad.context.close();
  }

  /* ===== 5. stage switch, reduced motion, phones ===== */
  {
    const { context, page } = await open(browser, base, '', { waitLab: false });
    await page.waitForFunction(() => window.__ssb.lab && !document.querySelector('#ssb-stage-mode [data-stage="lab"]').disabled, null, { timeout: 20000 });
    await act(page, () => page.click('#ssb-stage-mode [data-stage="lab"]'));
    const inLab = await page.evaluate(() => ({ name: window.__ssb.lab.name, hash: location.hash }));
    check('the Lab switch enters the first diorama', inLab.name === 'ethmoid-roof' && inLab.hash === '#lab=ethmoid-roof', JSON.stringify(inLab));
    await page.click('#ssb-stage-mode [data-stage="specimen"]');
    await page.waitForFunction(() => window.__ssb.lab.name === null, null, { timeout: 5000 }).catch(() => {});
    const back = await page.evaluate(() => ({ name: window.__ssb.lab.name, hash: location.hash, note: !document.getElementById('ssb-stage-note').hidden }));
    check('the Specimen switch leaves the lab', back.name === null && back.hash === '' && back.note, JSON.stringify(back));
    await context.close();
  }
  {
    const moving = await open(browser, base, '#lab=frontal-recess');
    /* software GL renders a few frames a second: count over a full second */
    const a = await moving.page.evaluate(() => ({ anim: window.__ssb.lab.animating, f: window.__ssb.frames }));
    await moving.page.waitForTimeout(1000);
    const b = await moving.page.evaluate(() => window.__ssb.frames);
    check('flow particles animate by default', a.anim && b - a.f >= 3, `${a.anim}, ${b - a.f} frames`);
    await moving.context.close();

    const still = await open(browser, base, '#lab=frontal-recess', { reducedMotion: 'reduce' });
    await still.page.waitForTimeout(800);
    const s0 = await still.page.evaluate(() => ({ anim: window.__ssb.lab.animating, f: window.__ssb.frames }));
    await still.page.waitForTimeout(1000);
    const s1 = await still.page.evaluate(() => window.__ssb.frames);
    check('reduced motion: no particle animation, no continuous rendering', !s0.anim && s1 - s0.f <= 1, `${s0.anim}, ${s1 - s0.f} frames`);
    await still.context.close();
  }
  {
    const phone = { width: 390, height: 844 };
    const { context, page } = await open(browser, base, '', { viewport: phone, waitLab: false });
    await page.waitForFunction(() => window.__ssb.lab && !document.querySelector('#ssb-stage-mode [data-stage="lab"]').disabled, null, { timeout: 20000 });
    await act(page, () => page.click('#ssb-stage-mode [data-stage="lab"]'));
    const sheet = await page.evaluate(() => {
      const lab = document.getElementById('ssb-lab');
      const panel = document.getElementById('ssb-panel');
      const r = lab.getBoundingClientRect();
      return { inSheet: panel.contains(lab), open: panel.dataset.sheet, view: panel.dataset.view, visible: r.height > 0 && r.width > 0, width: r.width };
    });
    check('phone: lab controls open in the bottom sheet', sheet.inSheet && sheet.open === 'open' && sheet.view === 'controls' && sheet.visible, JSON.stringify(sheet));
    const noScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    check('phone: no horizontal page scroll', noScroll);
    await act(page, () => page.click('button[data-cls="c.keros"][data-code="III"]'));
    check('phone: a preset in the sheet rebuilds the diorama', (await page.evaluate(() => window.__ssb.lab.params.keros)) === 12);
    await context.close();
  }

  /* ===== screenshots ===== */
  if (SHOTS) {
    for (const [name, cls, code] of [['ethmoid-roof', 'c.keros', 'III'], ['frontal-recess', 'c.ifac', 'SBFC']]) {
      for (const [kind, viewport] of [['desktop', { width: 1280, height: 800 }], ['phone', { width: 390, height: 844 }]]) {
        const { context, page } = await open(browser, base, `#lab=${name}`, { viewport });
        if (kind === 'phone') {
          await page.click('#ssb-sheet-handle');
          await page.click('#ssb-sheet-tabs [data-view="controls"]');
        }
        await act(page, () => page.click(`button[data-cls="${cls}"][data-code="${code}"]`));
        if (kind === 'phone') {
          await page.waitForTimeout(300);
          await page.screenshot({ path: path.join(SHOTS, `lab-${name}-phone-controls.png`) });
          await page.click('#ssb-sheet-handle');
        }
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(SHOTS, `lab-${name}-${kind}.png`) });
        await context.close();
      }
    }
  }

  const errs = allErrors.flat();
  check('zero real console errors across every page', errs.length === 0, errs.slice(0, 3).map((e) => `${e.type}: ${e.text}`).join(' | '));

  await browser.close();
  if (server) await server.close();

  const failures = results.filter((r) => !r.ok).length;
  console.log('=== SSB behavior tests ===');
  for (const r of results) console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '  — ' + (r.detail || '')}`);
  console.log(`\n${failures ? 'FAILED' : 'OK'} — ${results.length - failures}/${results.length} checks passed.`);
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
