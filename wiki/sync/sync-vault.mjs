#!/usr/bin/env node
/* =============================================================
   sync-vault.mjs — copy the publishable part of the sk.oto Obsidian
   vault into a Quartz 5 content/ folder. Scaffold (see wiki/README.md).

   This script is the privacy boundary between the vault and the web,
   so it fails closed:
   - allowlist of folders (wiki/sync/policy.json); anything else stays
     home — data_sources/, _drafts/, .agents/, governance docs, scripts
   - only .md files; symlinks are never followed
   - "## Personal Notes" sections are cut out (fence-aware)
   - frontmatter gate (status, draft, optional vetted)
   - PHI / credential tripwire: a matching note is held, not published
   - wikilinks to notes that were not published are unlinked to their
     alias text, so the site has no dead links into private notes
   - unvetted notes get a tag and a warning callout
   - the H1 that repeats the frontmatter title is dropped (Quartz
     renders the title itself)
   - optional phase gate on `tier` (policy gate.tierMatches), e.g.
     maps of content only while the rest is being vetted
   - every published note ends with a "Suggest a correction" link to a
     prefilled GitHub issue (policy.feedback) — the public half of the
     reader-feedback loop; wiki/feedback/pull-feedback.mjs is the other
   - it only ever deletes files it wrote itself (tracked in
     <out>/.vault-sync.json); it refuses a non-empty folder it did not
     create

   Pure Node, zero dependencies. Dry run by default.

   Usage:
     node wiki/sync/sync-vault.mjs --vault ~/sk.oto --out ../ent-wiki/content          # dry run
     node wiki/sync/sync-vault.mjs --vault ~/sk.oto --out ../ent-wiki/content --write  # do it
     options: --policy <file>  --report <file.json>  --quiet
   Exit code: 0 ok, 1 bad usage/refusal, 2 notes were held for review.
   ============================================================= */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MARKER = '.vault-sync.json';

/* ---------- small, dependency-free frontmatter handling ----------
   The vault's frontmatter is flat: scalars and simple "- item" lists
   (AGENTS.md §2). This reads exactly that and keeps the original text
   for everything it does not touch. */
export function splitFrontmatter(src) {
    const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
    if (!m) return { fm: null, fmText: '', body: src };
    return { fm: parseYamlLite(m[1]), fmText: m[1], body: src.slice(m[0].length) };
}

function unquote(v) {
    v = v.trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
    return v;
}

export function parseYamlLite(text) {
    const out = {};
    let key = null;
    for (const line of text.split(/\r?\n/)) {
        const item = /^\s+-\s+(.*)$/.exec(line);
        if (item && key) { (Array.isArray(out[key]) ? out[key] : (out[key] = [])).push(unquote(item[1])); continue; }
        const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
        if (kv) {
            key = kv[1];
            const v = kv[2].trim();
            if (v === '') out[key] = [];
            else if (/^\[.*\]$/.test(v)) out[key] = v.slice(1, -1).split(',').map(unquote).filter(Boolean);
            else out[key] = unquote(v);
        }
    }
    return out;
}

/* Remove top-level keys (and their list items) from raw frontmatter text. */
export function dropKeys(fmText, keys) {
    const lines = fmText.split(/\r?\n/);
    const out = [];
    let dropping = false;
    for (const line of lines) {
        const kv = /^([A-Za-z0-9_-]+):/.exec(line);
        if (kv) dropping = keys.includes(kv[1]);
        else if (!/^\s/.test(line)) dropping = false;
        if (!dropping) out.push(line);
    }
    return out.join('\n');
}

/* Append a tag to the frontmatter's tags list (block or inline form). */
export function addTag(fmText, tag) {
    const lines = fmText.split(/\r?\n/);
    const i = lines.findIndex((l) => /^tags:/.test(l));
    if (i === -1) return fmText + `\ntags:\n  - ${tag}`;
    const inline = /^tags:\s*\[(.*)\]\s*$/.exec(lines[i]);
    if (inline) { lines[i] = `tags: [${inline[1] ? inline[1] + ', ' : ''}${tag}]`; return lines.join('\n'); }
    let j = i + 1;
    while (j < lines.length && /^\s+-\s/.test(lines[j])) j++;
    const indent = (/^(\s+)-/.exec(lines[i + 1] || '') || [, '  '])[1];
    lines.splice(j, 0, `${indent}- ${tag}`);
    return lines.join('\n');
}

/* ---------- body transforms ---------- */

/* Cut every "## <name>" section (to the next heading of level <= 2),
   ignoring headings that appear inside fenced code. */
export function stripSections(body, names) {
    const want = new Set(names.map((n) => n.toLowerCase()));
    const lines = body.split(/\r?\n/);
    const out = [];
    let fence = null;
    let cutting = false;
    let cut = 0;
    for (const line of lines) {
        const f = /^\s*(```+|~~~+)/.exec(line);
        if (f) {
            if (!fence) fence = f[1][0];
            else if (f[1][0] === fence) fence = null;
            if (!cutting) out.push(line);
            continue;
        }
        if (!fence) {
            const h = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
            if (h && h[1].length <= 2) {
                cutting = h[1].length === 2 && want.has(h[2].toLowerCase());
                if (cutting) { cut++; continue; }
            }
        }
        if (!cutting) out.push(line);
    }
    return { body: out.join('\n'), cut };
}

/* Rewrite [[Target|Alias]] / [[Target#Head]] / ![[Embed]] whose target
   is not in the published set: links become their display text, embeds
   are removed. Handles the table-escaped pipe "\|". */
export function unlinkMissing(body, published) {
    let unlinked = 0;
    const text = body.replace(/(!?)\[\[([^\]\n]+?)\]\]/g, (all, bang, inner) => {
        const [targetPart, ...aliasParts] = inner.split(/\\?\|/);
        const target = targetPart.split('#')[0].trim();
        if (target === '' || published.has(target.toLowerCase())) return all;
        unlinked++;
        if (bang) return '';
        const alias = aliasParts.join('|').trim();
        return alias || targetPart.replace('#', ' › ').trim();
    });
    return { body: text, unlinked };
}

/* Put a callout directly under the first H1 (or at the top). */
export function insertAfterH1(body, block) {
    const lines = body.split(/\r?\n/);
    const i = lines.findIndex((l) => /^#\s+/.test(l));
    if (i === -1) return block + '\n\n' + body.replace(/^\s*\n/, '');
    lines.splice(i + 1, 0, '', block);
    return lines.join('\n');
}

/* Vault notes repeat their title as the first H1 (AGENTS.md rule 2);
   Quartz already renders frontmatter `title`, so drop the duplicate. */
export function dropTitleH1(body, title) {
    if (!title) return body;
    const m = /^(\s*)#\s+(.+?)\s*\r?\n/.exec(body);
    if (!m || m[2].trim() !== String(title).trim()) return body;
    return body.slice(m[0].length);
}

/* The per-note link into the issue form. `note` is the vault-relative
   path, which is what pull-feedback.mjs maps the issue back onto.
   Parentheses are encoded so the URL cannot end the Markdown link. */
export function feedbackLink(fb, rel, title) {
    const q = (s) => encodeURIComponent(s).replace(/[()]/g, (c) => (c === '(' ? '%28' : '%29'));
    const url = `${fb.issueUrl}${fb.issueUrl.includes('?') ? '&' : '?'}${fb.field}=${q(rel)}&title=${q(`${fb.titlePrefix || ''}${title || rel}`)}`;
    return `${fb.text.replace('{url}', url)}`;
}

/* ---------- vault walk ---------- */
function walk(dir, skipPrefixes, acc = []) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        if (skipPrefixes.some((p) => ent.name.startsWith(p))) continue;
        const p = path.join(dir, ent.name);
        if (ent.isSymbolicLink()) continue; // never follow out of the vault
        if (ent.isDirectory()) walk(p, skipPrefixes, acc);
        else if (ent.isFile()) acc.push(p);
    }
    return acc;
}

export function plan(vault, policy) {
    const candidates = [];
    const skipped = { notMarkdown: 0, outsideAllowlist: 0 };
    for (const folder of policy.includeFolders) {
        const abs = path.join(vault, folder);
        let st;
        try { st = fs.lstatSync(abs); } catch (e) { continue; }
        if (!st.isDirectory()) continue;
        for (const f of walk(abs, policy.skipNamesStartingWith)) {
            if (f.toLowerCase().endsWith('.md')) candidates.push(f);
            else skipped.notMarkdown++;
        }
    }
    for (const name of policy.includeRootFiles) {
        const abs = path.join(vault, name);
        try { if (fs.lstatSync(abs).isFile()) candidates.push(abs); } catch (e) { /* absent */ }
    }
    return { candidates, skipped };
}

export function transform(vault, policy, candidates) {
    const holdRes = (policy.holdIfBodyMatches.patterns || []).map((p) => new RegExp(p, 'i'));
    const gate = policy.gate;
    const notes = [];
    const report = { published: [], gated: [], held: [], personalSectionsCut: 0, linksUnlinked: 0, unvetted: 0 };

    for (const abs of candidates) {
        const rel = path.relative(vault, abs);
        const src = fs.readFileSync(abs, 'utf8');
        const { fm, fmText, body } = splitFrontmatter(src);
        const meta = fm || {};
        const status = String(meta.status || '').toLowerCase();
        const isRootIndex = policy.includeRootFiles.includes(rel);

        if (!isRootIndex) {
            if (gate.honorDraftTrue && String(meta.draft).toLowerCase() === 'true') { report.gated.push({ rel, why: 'draft: true' }); continue; }
            if (gate.statusIn.length && !gate.statusIn.includes(status)) { report.gated.push({ rel, why: `status: ${status || '(none)'}` }); continue; }
            if (gate.requireVetted && !String(meta.vetted || '').trim()) { report.gated.push({ rel, why: 'not vetted' }); continue; }
            if (gate.tierMatches && !new RegExp(gate.tierMatches, 'i').test(String(meta.tier || ''))) { report.gated.push({ rel, why: `tier: ${meta.tier || '(none)'}` }); continue; }
        }

        const stripped = stripSections(body, policy.stripSections);
        const hit = holdRes.find((re) => re.test(stripped.body) || re.test(fmText));
        if (hit) { report.held.push({ rel, pattern: hit.source }); continue; }

        notes.push({ rel, meta, fmText, body: stripped.body, cut: stripped.cut });
    }

    /* Everything a wikilink may resolve to: basenames + aliases. */
    const published = new Set();
    for (const n of notes) {
        published.add(path.basename(n.rel, '.md').toLowerCase());
        published.add(n.rel.replace(/\.md$/i, '').toLowerCase());
        for (const a of [].concat(n.meta.aliases || [])) published.add(String(a).toLowerCase());
    }

    const files = [];
    for (const n of notes) {
        let fmText = dropKeys(n.fmText, policy.dropFrontmatterKeys);
        let body = policy.dropTitleH1 ? dropTitleH1(n.body, n.meta.title) : n.body;
        const link = unlinkMissing(body, published);
        body = link.body;
        const unvetted = !String(n.meta.vetted || '').trim() && !policy.includeRootFiles.includes(n.rel);
        if (unvetted && policy.unvetted) {
            fmText = addTag(fmText, policy.unvetted.tag);
            body = insertAfterH1(body, policy.unvetted.callout);
            report.unvetted++;
        }
        if (policy.feedback && policy.feedback.issueUrl) {
            body = body.replace(/\s*$/, '') + '\n\n' + feedbackLink(policy.feedback, n.rel, n.meta.title) + '\n';
        }
        report.personalSectionsCut += n.cut;
        report.linksUnlinked += link.unlinked;
        report.published.push(n.rel);
        const out = (n.fmText !== '' || fmText !== '') ? `---\n${fmText}\n---\n${body.startsWith('\n') ? '' : '\n'}${body}` : body;
        files.push({ rel: n.rel, text: out });
    }
    return { files, report };
}

/* ---------- write, touching only what this script owns ---------- */
export function write(outDir, files) {
    fs.mkdirSync(outDir, { recursive: true });
    const markerPath = path.join(outDir, MARKER);
    let owned = [];
    if (fs.existsSync(markerPath)) {
        owned = JSON.parse(fs.readFileSync(markerPath, 'utf8')).files || [];
    } else {
        const existing = fs.readdirSync(outDir).filter((n) => n !== 'index.md' && !n.startsWith('.'));
        if (existing.length) throw new Error(`refusing to write into ${outDir}: it has files this script did not create (${existing.slice(0, 3).join(', ')}…)`);
    }
    const next = new Set(files.map((f) => f.rel));
    for (const rel of owned) {
        if (next.has(rel)) continue;
        const p = path.join(outDir, rel);
        if (!path.resolve(p).startsWith(path.resolve(outDir) + path.sep)) continue;
        try { fs.unlinkSync(p); } catch (e) { /* already gone */ }
    }
    for (const f of files) {
        const p = path.join(outDir, f.rel);
        fs.mkdirSync(path.dirname(p), { recursive: true });
        fs.writeFileSync(p, f.text);
    }
    fs.writeFileSync(markerPath, JSON.stringify({ note: 'Written by wiki/sync/sync-vault.mjs; lists the files it owns here.', files: [...next].sort() }, null, 2) + '\n');
}

/* ---------- CLI ---------- */
function main(argv) {
    const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
    const vault = opt('--vault');
    const outDir = opt('--out');
    const doWrite = argv.includes('--write');
    const quiet = argv.includes('--quiet');
    if (!vault || !outDir) { console.error('usage: sync-vault.mjs --vault <sk.oto> --out <quartz>/content [--write] [--policy f] [--report f]'); return 1; }
    if (path.resolve(outDir).startsWith(path.resolve(vault) + path.sep) || path.resolve(outDir) === path.resolve(vault)) {
        console.error('refusing: --out is inside the vault'); return 1;
    }
    const policy = JSON.parse(fs.readFileSync(opt('--policy') || path.join(HERE, 'policy.json'), 'utf8'));
    const { candidates, skipped } = plan(vault, policy);
    const { files, report } = transform(vault, policy, candidates);

    const summary = {
        mode: doWrite ? 'write' : 'dry-run',
        candidates: candidates.length,
        published: report.published.length,
        gated: report.gated.length,
        held: report.held.length,
        personalSectionsCut: report.personalSectionsCut,
        linksUnlinked: report.linksUnlinked,
        unvettedFlagged: report.unvetted,
        nonMarkdownSkipped: skipped.notMarkdown,
    };
    if (!quiet) {
        console.log(JSON.stringify(summary, null, 2));
        for (const h of report.held) console.log(`  HELD  ${h.rel}  (/${h.pattern}/)`);
    }
    if (opt('--report')) fs.writeFileSync(opt('--report'), JSON.stringify({ summary, ...report }, null, 2) + '\n');
    if (doWrite) {
        try { write(outDir, files); } catch (e) { console.error(e.message); return 1; }
    }
    return report.held.length ? 2 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exit(main(process.argv.slice(2)));
}
