#!/usr/bin/env node
/* =============================================================
   test-a11y.mjs — axe-core accessibility scan of every page in
   tools/smoke-pages.mjs (PAGES), in light and dark theme.

   REPORT-ONLY by default: prints a table and exits 0. Nothing here
   fixes a page. Coverage is the same as the smoke test: each PAGES
   entry runs its setup and readiness steps (so folded sections and
   eggs are open), then axe runs on the resulting document.

   axe-core is a pinned DEV dependency (package.json). Its file is
   evaluated with page.evaluate, which bypasses the page CSP, so the
   pages keep script-src 'self'. axe reads only the top document: the
   OKSAT learning frames and the WebGL canvases are not inspected
   beyond their surrounding DOM.

   Usage:
     node tools/test-a11y.mjs                  # report, exit 0
     node tools/test-a11y.mjs --json <file>    # also write the full result
     node tools/test-a11y.mjs --page oksat     # only paths starting with this
     node tools/test-a11y.mjs --check          # exit 1 on violations NOT in
                                               # tools/a11y-baseline.json, or
                                               # a higher node count than it
     node tools/test-a11y.mjs --write-baseline # regenerate the baseline

   Baseline entries are { page, theme, rule, count } (count = nodes),
   with no HTML snippets. Page keys are PAGES paths; when one path
   appears more than once, the largest count per rule is kept.
   ============================================================= */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { startServer, launchBrowser, ROOT } from './smoke-lib.mjs';
import { PAGES } from './smoke-pages.mjs';

const AXE_VERSION = '4.10.2';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa'];
const THEMES = ['light', 'dark'];
const VIEWPORT = { width: 1280, height: 800 };
const BASELINE = path.join(ROOT, 'tools/a11y-baseline.json');
const IMPACT_ORDER = ['critical', 'serious', 'moderate', 'minor', 'none'];

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null; };
const JSON_OUT = opt('--json');
const ONLY = opt('--page');
const CHECK = args.includes('--check');
const WRITE_BASELINE = args.includes('--write-baseline');

const axeSource = fs.readFileSync(path.join(ROOT, 'node_modules/axe-core/axe.min.js'), 'utf8');

/* Run one PAGES entry in one theme. Returns the page's violations. */
async function scan(browser, base, spec, theme) {
    const started = Date.now();
    const context = await browser.newContext({ viewport: VIEWPORT });
    await context.addInitScript((t) => { try { localStorage.setItem('sk_theme', t); } catch (e) { /* storage blocked */ } }, theme);
    const page = await context.newPage();
    const out = { path: spec.path, theme, notReady: null, violations: [], runtimeMs: 0 };
    try {
        if (spec.setup) await spec.setup(page);
        await page.goto(base + '/' + spec.path, { waitUntil: 'domcontentloaded', timeout: 15000 });
        try { await spec.ready(page); } catch (e) { out.notReady = (e.message || String(e)).split('\n')[0]; }
        await page.waitForTimeout(400);
        await page.evaluate(axeSource);
        out.violations = await page.evaluate(async (tags) => {
            const r = await window.axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] });
            return r.violations.map((v) => ({
                id: v.id, impact: v.impact || 'none', help: v.help, helpUrl: v.helpUrl,
                nodes: v.nodes.length,
                targets: v.nodes.map((n) => JSON.stringify(n.target)),
                html: v.nodes.map((n) => n.html),
            }));
        }, TAGS);
    } catch (e) {
        out.notReady = out.notReady || `scan failed: ${(e.message || String(e)).split('\n')[0]}`;
    } finally {
        out.runtimeMs = Date.now() - started;
        await context.close();
    }
    return out;
}

/* Merge results by page path + theme: the largest node count per rule wins. */
function merge(results) {
    const map = new Map();
    for (const r of results) {
        const key = `${r.path}\u0000${r.theme}`;
        if (!map.has(key)) map.set(key, { path: r.path, theme: r.theme, notReady: [], rules: new Map(), runtimeMs: 0 });
        const m = map.get(key);
        if (r.notReady) m.notReady.push(r.notReady);
        m.runtimeMs += r.runtimeMs;
        for (const v of r.violations) {
            const prev = m.rules.get(v.id);
            if (!prev || v.nodes > prev.nodes) m.rules.set(v.id, v);
        }
    }
    return [...map.values()];
}

function baselineKey(e) { return `${e.page}\u0000${e.theme}\u0000${e.rule}`; }

async function main() {
    const server = await startServer();
    const browser = await launchBrowser();
    const specs = ONLY ? PAGES.filter((p) => p.path.startsWith(ONLY)) : PAGES;
    const started = Date.now();
    const results = [];
    try {
        for (const spec of specs) for (const theme of THEMES) {
            const r = await scan(browser, server.origin, spec, theme);
            results.push(r);
            const n = r.violations.reduce((a, v) => a + v.nodes, 0);
            console.error(`  ${spec.path} [${theme}] ${r.violations.length} rule(s), ${n} node(s)${r.notReady ? '  (not ready: ' + r.notReady + ')' : ''}`);
        }
    } finally {
        await browser.close();
        await server.close();
    }
    const pages = merge(results);

    /* flat rows: page x theme x rule x impact x nodes */
    const rows = [];
    for (const p of pages) for (const v of p.rules.values()) {
        rows.push({ page: p.path, theme: p.theme, rule: v.id, impact: v.impact, count: v.nodes, help: v.help });
    }
    rows.sort((a, b) => IMPACT_ORDER.indexOf(a.impact) - IMPACT_ORDER.indexOf(b.impact)
        || a.rule.localeCompare(b.rule) || a.page.localeCompare(b.page) || a.theme.localeCompare(b.theme));

    /* the table */
    const cols = ['page', 'theme', 'rule', 'impact', 'nodes'];
    const table = rows.map((r) => [r.page, r.theme, r.rule, r.impact, String(r.count)]);
    const widths = cols.map((c, i) => Math.max(c.length, ...table.map((row) => row[i].length)));
    const line = (cells) => cells.map((c, i) => (i === cols.length - 1 ? c : c.padEnd(widths[i]))).join('  ');
    console.log(line(cols));
    console.log(widths.map((w) => '-'.repeat(w)).join('  '));
    for (const row of table) console.log(line(row));
    const clean = pages.filter((p) => p.rules.size === 0).map((p) => `${p.path} [${p.theme}]`);
    console.log(`\nclean (no violations): ${clean.length ? clean.join(', ') : 'none'}`);
    const notReady = pages.filter((p) => p.notReady.length);
    if (notReady.length) console.log(`not ready (scanned anyway): ${notReady.map((p) => `${p.path} [${p.theme}]`).join(', ')}`);
    const byImpact = {};
    for (const r of rows) byImpact[r.impact] = (byImpact[r.impact] || 0) + 1;
    const ruleCounts = {};
    for (const r of rows) ruleCounts[r.rule] = (ruleCounts[r.rule] || 0) + 1;
    console.log(`\nviolation rows by impact: ${IMPACT_ORDER.filter((i) => byImpact[i]).map((i) => `${i} ${byImpact[i]}`).join(', ') || 'none'}`);
    console.log(`most common rules: ${Object.entries(ruleCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} (${v})`).join(', ') || 'none'}`);
    console.log(`runtime: ${((Date.now() - started) / 1000).toFixed(1)} s, axe-core ${AXE_VERSION}, tags ${TAGS.join(' ')}`);

    const baselineEntries = rows.map((r) => ({ page: r.page, theme: r.theme, rule: r.rule, count: r.count }))
        .sort((a, b) => a.page.localeCompare(b.page) || a.theme.localeCompare(b.theme) || a.rule.localeCompare(b.rule));

    if (JSON_OUT) {
        const full = {
            axe: AXE_VERSION, tags: TAGS, generated: new Date().toISOString(),
            pages: pages.map((p) => ({
                path: p.path, theme: p.theme, notReady: p.notReady, runtimeMs: p.runtimeMs,
                violations: [...p.rules.values()],
            })),
        };
        fs.writeFileSync(path.resolve(JSON_OUT), JSON.stringify(full, null, 2) + '\n');
        console.log(`full result written to ${path.resolve(JSON_OUT)}`);
    }

    if (WRITE_BASELINE) {
        const out = { axe: AXE_VERSION, tags: TAGS, note: 'rule id, page, theme and node count only; regenerate with --write-baseline', entries: baselineEntries };
        fs.writeFileSync(BASELINE, JSON.stringify(out, null, 2) + '\n');
        console.log(`baseline written: ${path.relative(ROOT, BASELINE)} (${baselineEntries.length} entries)`);
        return 0;
    }

    if (CHECK) {
        if (!fs.existsSync(BASELINE)) { console.error(`--check: ${path.relative(ROOT, BASELINE)} is missing`); return 1; }
        const base = new Map(JSON.parse(fs.readFileSync(BASELINE, 'utf8')).entries
            .map((e) => [baselineKey({ page: e.page, theme: e.theme, rule: e.rule }), e.count]));
        const regressions = [];
        for (const r of rows) {
            const k = baselineKey({ page: r.page, theme: r.theme, rule: r.rule });
            const was = base.has(k) ? base.get(k) : null;
            if (was === null) regressions.push(`new: ${r.page} [${r.theme}] ${r.rule} (${r.impact}, ${r.count} nodes)`);
            else if (r.count > was) regressions.push(`worse: ${r.page} [${r.theme}] ${r.rule} ${was} -> ${r.count} nodes`);
        }
        if (regressions.length) {
            console.log(`\na11y check FAILED: ${regressions.length} violation(s) not in the baseline`);
            for (const x of regressions) console.log('  ' + x);
            return 1;
        }
        console.log('\na11y check OK: no violation outside the baseline');
    }
    return 0;
}

const entry = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (entry) {
    main().then((code) => process.exit(code), (e) => { console.error(e); process.exit(1); });
}
