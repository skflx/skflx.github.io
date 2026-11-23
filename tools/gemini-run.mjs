#!/usr/bin/env node
/* Delegate one brief to Gemini CLI, headless (docs/delegation.md §9).

   node tools/gemini-run.mjs <brief.md> [--mode work|read] [--model <id>] [--timeout <min>]

   work (default): the WP-format brief (docs/delegation.md §2) runs in a throwaway git worktree under
     .claude/worktrees/, so nothing touches your checkout. Afterwards the diff is checked against the
     brief's `Touch:` list, and a patch is written for the caller to review and apply.
   read: read-only (--approval-mode plan) in this checkout, for review, research or drafting. The
     tree is compared before and after, so a write is reported.

   Exit: 0 ok · 1 usage · 2 Gemini failed · 3 Touch violation, commit, or write in read mode.
   Env: GEMINI_BIN (default `gemini`; e.g. `npx -y @google/gemini-cli`), plus Gemini's own auth
   (GEMINI_API_KEY or a cached login). Nothing here commits, pushes or reads a credential. */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i < 0 ? d : args.splice(i, 2)[1]; };
const mode = flag('--mode', 'work');
const model = flag('--model', '');
const timeoutMin = Number(flag('--timeout', '20'));
const briefPath = args[0];
if (!briefPath || !['work', 'read'].includes(mode) || !(timeoutMin > 0)) {
    console.error('usage: node tools/gemini-run.mjs <brief.md> [--mode work|read] [--model <id>] [--timeout <min>]');
    process.exit(1);
}
const brief = fs.readFileSync(briefPath, 'utf8');

const run = (cmd, a, o = {}) => spawnSync(cmd, a, { encoding: 'utf8', maxBuffer: 1 << 28, ...o });
const git = (cwd, ...a) => run('git', ['-C', cwd, ...a]);
const status = (cwd) => git(cwd, 'status', '--porcelain=v1', '-z', '--untracked-files=all').stdout;

/* `Touch:` field of the WP format: every backticked path or glob up to the next field label. */
function touchList(text) {
    const m = text.match(/^Touch:[ \t]*([\s\S]*?)(?=^(?:Goal|Read|Don't|Steps|Accept|Escalate):|(?![\s\S]))/m);
    return m ? [...m[1].matchAll(/`([^`]+)`/g)].map((x) => x[1]) : [];
}
const globRe = (g) => new RegExp('^' + g.split('**').map((s) => s.split('*').map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*')).join('.*') + '$');
const allowed = (f, touch) => touch.some((g) => (g.endsWith('/') ? f.startsWith(g) : globRe(g).test(f)));

/* Paths from `status -z` (a rename or copy carries its origin as a second field). */
function changed(porcelain) {
    const f = porcelain.split('\0'); const out = [];
    for (let i = 0; i < f.length; i++) {
        if (f[i].length < 4) continue;
        const p = f[i].slice(3);
        if (/[RC]/.test(f[i].slice(0, 2))) i++;
        if (p !== 'node_modules') out.push(p);
    }
    return out;
}

const touch = touchList(brief);
if (mode === 'work' && !touch.length) {
    console.error('BLOCKED: the brief has no `Touch:` field with backticked paths; refusing an unbounded edit.');
    process.exit(1);
}

const prompt = mode === 'work'
    ? `You are the executor for the work package below, in the repository at your working directory.
Read AGENTS.md, then docs/delegation.md §3, then only the brief's Read list. Stay inside its Touch list.
Do not commit, push, branch or open a PR. If you need a file outside Touch, or a decision the brief did not make,
stop and print "BLOCKED: <why>". Run the Accept commands yourself and end your reply with the tail of each output.

--- BRIEF ---
${brief}`
    : `Read-only task in the repository at your working directory. Read AGENTS.md first. Do not edit, create or delete
any file, and run no command that changes the tree. Answer in your reply.

--- BRIEF ---
${brief}`;

let cwd = root, wt = '', id = '';
if (mode === 'work') {
    const slug = path.basename(briefPath).replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    id = `${slug}-${Date.now().toString(36)}`;
    wt = path.join(root, '.claude/worktrees', `gemini-${id}`);
    const r = git(root, 'worktree', 'add', '-b', `gemini/${id}`, wt, 'HEAD');
    if (r.status) { console.error(r.stderr); process.exit(1); }
    if (changed(status(root)).length) console.error('note: your checkout has uncommitted changes; the worktree starts from HEAD without them.');
    try { fs.symlinkSync(path.join(root, 'node_modules'), path.join(wt, 'node_modules')); } catch { /* none installed */ }
    cwd = wt;
}
const base = git(cwd, 'rev-parse', 'HEAD').stdout.trim();
const before = mode === 'read' ? status(cwd) : '';

const bin = (process.env.GEMINI_BIN || 'gemini').split(/\s+/);
const gArgs = [...bin.slice(1), '-p', 'Carry out the task given on stdin.', '--output-format', 'json', '--skip-trust',
    '--approval-mode', mode === 'work' ? 'yolo' : 'plan', ...(model ? ['-m', model] : [])];
const g = run(bin[0], gArgs, { cwd, input: prompt, timeout: timeoutMin * 60000, env: process.env });

let reply = g.stdout || '', err = '';
try { const j = JSON.parse(g.stdout); reply = j.response ?? ''; err = j.error ? (j.error.message || JSON.stringify(j.error)) : ''; } catch { /* plain text */ }
console.log(reply.trim());
if (g.error || g.status || err) {
    console.error(`\ngemini failed: ${g.error?.message || err || `exit ${g.status}`}\n${(g.stderr || '').slice(-1500)}`);
    if (wt) console.error(`worktree kept: ${wt}`);
    process.exit(2);
}

const problems = [];
if (git(cwd, 'rev-parse', 'HEAD').stdout.trim() !== base) problems.push('Gemini committed (HEAD moved)');
if (mode === 'read') {
    if (status(cwd) !== before) problems.push('the tree changed in read-only mode');
} else {
    const files = changed(status(cwd));
    for (const f of files) if (!allowed(f, touch)) problems.push(`outside Touch: ${f}`);
    git(cwd, 'add', '-A', '--', '.', ':!node_modules');
    const patch = `${wt}.patch`;
    fs.writeFileSync(patch, git(cwd, 'diff', '--cached', '--binary', base).stdout);
    console.error(`\n${files.length} file(s) changed in ${wt}\npatch: ${patch}\napply: git apply --3way ${patch}\nclean: git worktree remove --force ${wt} && git branch -D gemini/${id} && rm ${patch}`);
}
if (problems.length) { console.error('\nREVIEW BEFORE APPLYING:\n- ' + problems.join('\n- ')); process.exit(3); }
