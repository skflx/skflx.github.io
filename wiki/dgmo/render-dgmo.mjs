#!/usr/bin/env node
/* =============================================================
   render-dgmo.mjs — turn ```dgmo fences in Quartz content/ into
   inline SVG at build time (scaffold; see wiki/README.md §Diagrams).

   The vault writes diagrams in DGMO (https://github.com/diagrammo/dgmo),
   which Obsidian renders through the obsidian-dgmo plugin. Quartz has
   no DGMO support, so this runs in the wiki repo after sync and before
   `quartz build`, using the same @diagrammo/dgmo library the plugin
   uses. Output is static SVG — no client script, no CDN, no layout
   shift — rendered twice (light and dark) with a palette taken from
   the site's tokens; custom.scss shows the one matching the theme.
   The source stays one click away under the diagram.

   A fence that fails to render is left as a code block and reported;
   it never breaks the build.

   Needs `@diagrammo/dgmo` in the wiki repo (npm i -D @diagrammo/dgmo).
   Usage: node render-dgmo.mjs content [--check]
     --check  report what would change, write nothing
   ============================================================= */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/* skflx.MD tokens (css/site.css) as a DGMO palette. Paper/ink ground,
   audiogram blue as the primary, red kept for danger/emphasis. */
export const SKFLX_PALETTE = {
    id: 'skflx',
    name: 'skflx.MD',
    light: {
        bg: '#F1F1EC', surface: '#FAFAF7', overlay: '#E7E8E1', border: '#B4B6AE',
        text: '#121418', textMuted: '#4A4F57', textOnFillLight: '#FAFAF7', textOnFillDark: '#121418',
        primary: '#2445B0', secondary: '#4A4F57', accent: '#1F7A52', destructive: '#B8371A',
        colors: {
            red: '#B8371A', orange: '#B86A1A', yellow: '#A8863A', green: '#1F7A52', blue: '#2445B0',
            purple: '#6E4A8B', teal: '#2F6E6A', cyan: '#2B7FA3', gray: '#646973', black: '#121418', white: '#FAFAF7',
        },
    },
    dark: {
        bg: '#0D0E10', surface: '#16181B', overlay: '#1C1F23', border: '#3A3E45',
        text: '#ECEBE6', textMuted: '#A6AAB2', textOnFillLight: '#ECEBE6', textOnFillDark: '#0D0E10',
        primary: '#8EA7FF', secondary: '#A6AAB2', accent: '#5FD3A0', destructive: '#FF6B42',
        colors: {
            red: '#FF6B42', orange: '#F0A05A', yellow: '#D9BD5A', green: '#5FD3A0', blue: '#8EA7FF',
            purple: '#B79BE0', teal: '#5FB8B0', cyan: '#6CC3E8', gray: '#7E838C', black: '#16181B', white: '#ECEBE6',
        },
    },
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* The whole figure must be one line: a blank line would end the Markdown
   HTML block and spill the rest into the page as text. SVGs are collapsed;
   the <pre> source keeps its newlines as &#10;. */
const oneLine = (svg) => svg.replace(/\r?\n\s*/g, ' ').trim();

/* DGMO 0.86 centers the chart title on an assumed 1200px canvas
   (x = options.width / 2), not on the laid-out diagram, so the title
   lands off-canvas on anything narrower. Re-center it on the viewBox. */
export function recenterTitle(svg) {
    const vb = /viewBox="([-\d.]+)\s+([-\d.]+)\s+([\d.]+)\s+([\d.]+)"/.exec(svg);
    if (!vb) return svg;
    const cx = (parseFloat(vb[1]) + parseFloat(vb[3]) / 2).toFixed(1);
    return svg.replace(/(<text\b[^>]*class="chart-title"[^>]*\bx=")[-\d.]+(")/, `$1${cx}$2`);
}

/* Replace every ```dgmo … ``` (or ~~~dgmo) fence. `renderFn(src, theme)`
   resolves to { svg } or throws. Pure apart from renderFn, so it is
   testable without the library. */
export async function transformMarkdown(md, renderFn) {
    const re = /^([ \t]*)(```+|~~~+)[ \t]*dgmo[^\n]*\n([\s\S]*?)\n\1\2[ \t]*$/gm;
    const parts = [];
    let last = 0, rendered = 0;
    const failed = [];
    for (const m of md.matchAll(re)) {
        parts.push(md.slice(last, m.index));
        last = m.index + m[0].length;
        const src = m[3];
        try {
            const [light, dark] = [await renderFn(src, 'light'), await renderFn(src, 'dark')];
            if (!light?.svg || !dark?.svg) throw new Error('empty render');
            const title = (src.split('\n')[0] || '').replace(/^\s*\S+\s*/, '').trim();
            parts.push([
                `<figure class="dgmo"${title ? ` aria-label="${esc(title)}"` : ''}>`,
                `<div class="dgmo-light">${oneLine(recenterTitle(light.svg))}</div>`,
                `<div class="dgmo-dark">${oneLine(recenterTitle(dark.svg))}</div>`,
                `<details class="dgmo-source"><summary>Diagram source</summary><pre><code>${esc(src).replace(/\r?\n/g, '&#10;')}</code></pre></details>`,
                `</figure>`,
            ].join(''));
            rendered++;
        } catch (e) {
            parts.push(m[0]);
            failed.push({ firstLine: src.split('\n')[0], error: String(e && e.message || e) });
        }
    }
    parts.push(md.slice(last));
    return { md: parts.join(''), rendered, failed };
}

async function main(argv) {
    const dir = argv.find((a) => !a.startsWith('--'));
    const check = argv.includes('--check');
    if (!dir) { console.error('usage: render-dgmo.mjs <content-dir> [--check]'); return 1; }
    const { render } = await import('@diagrammo/dgmo');
    /* render() resolves palettes by id, so register ours first. */
    const { registerPalette } = await import('@diagrammo/dgmo/advanced');
    registerPalette(SKFLX_PALETTE);
    const renderFn = (src, theme) => render(src, { theme, palette: SKFLX_PALETTE.id, onError: 'throw' });

    const files = [];
    (function walk(d) {
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
            const p = path.join(d, e.name);
            if (e.isDirectory()) walk(p);
            else if (e.isFile() && p.endsWith('.md')) files.push(p);
        }
    })(dir);

    let total = 0, touched = 0;
    const failures = [];
    for (const f of files) {
        const md = fs.readFileSync(f, 'utf8');
        if (!/(```|~~~)[ \t]*dgmo/.test(md)) continue;
        const out = await transformMarkdown(md, renderFn);
        total += out.rendered;
        for (const x of out.failed) failures.push({ file: path.relative(dir, f), ...x });
        if (out.rendered) { touched++; if (!check) fs.writeFileSync(f, out.md); }
    }
    console.log(`${check ? '[check] ' : ''}dgmo: ${total} diagram(s) rendered in ${touched} file(s); ${failures.length} left as code`);
    for (const x of failures) console.log(`  KEPT AS CODE  ${x.file}  "${x.firstLine}"  (${x.error})`);
    return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main(process.argv.slice(2)).then((c) => process.exit(c), (e) => { console.error(e); process.exit(1); });
}
