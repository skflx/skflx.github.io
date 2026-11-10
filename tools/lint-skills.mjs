#!/usr/bin/env node
/* =============================================================
   lint-skills.mjs — structural lint for the house skills
   (.claude/skills/*). Spec: plans/2026-11-10-skillsmith.md §3.

   Rules (default run; exit 1 on any failure, one line per finding,
   `<skill>: <rule>: <detail>`):
     frontmatter  name = folder; description non-empty, <= 1024, "Use when"
     length       body <= 300 lines
     paths        backticked repo paths in SKILL.md and reference/*.md exist
     evals        evals.json parses and meets the schema
     registered   skill named in AGENTS.md "## Skills"
     roster       roster.json has the four roles and a complete order
   Third-party folders (.claude/skills/THIRD_PARTY_SKILLS.md) get only
   `frontmatter`; a missing "Use when" there is a warning.

   Usage:  node tools/lint-skills.mjs [--due | --self-test]
   --due        report only, always exit 0
   --self-test  rule functions on in-memory skills, no files written
   Deps-free.
   ============================================================= */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS = path.join(ROOT, '.claude/skills');
const ROLES = ['planner', 'orchestrator', 'executor', 'scout'];
const STALE_DAYS = 120;

/* ---------- parsing ---------- */

// Minimal YAML frontmatter: `key: value`, quoted values, and folded/literal
// blocks (`key: >` / `key: |`) with indented continuation lines.
export function parseFrontmatter(text) {
    const m = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text);
    if (!m) return null;
    const fm = {};
    const lines = m[1].split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        const kv = /^([A-Za-z_][\w-]*):[ \t]*(.*)$/.exec(lines[i]);
        if (!kv) continue;
        const key = kv[1];
        let val = kv[2].trim();
        const block = /^([>|])[+-]?$/.exec(val);
        if (block || val === '') {
            const parts = [];
            while (i + 1 < lines.length && (/^\s+\S/.test(lines[i + 1]) || lines[i + 1].trim() === '')) {
                parts.push(lines[++i].trim());
            }
            val = block && block[1] === '|' ? parts.join('\n').trim() : parts.filter(Boolean).join(' ');
        } else if (/^(["']).*\1$/.test(val)) {
            val = val.slice(1, -1);
        }
        fm[key] = val;
    }
    return { fm, body: text.slice(m[0].length) };
}

// Backticked tokens that look like repo paths.
export function pathTokens(text) {
    const out = new Set();
    for (const m of text.matchAll(/`([^`\n]+)`/g)) {
        if (/^[\w.\-/]+$/.test(m[1]) && m[1].includes('/')) out.add(m[1]);
    }
    return [...out];
}

/* ---------- rules: each returns an array of detail strings (empty = pass) ---------- */

export function ruleFrontmatter(text, folder) {
    const p = parseFrontmatter(text);
    if (!p) return { errors: ['SKILL.md does not open with --- frontmatter'], warns: [] };
    const errors = [], warns = [];
    const { name, description } = p.fm;
    if (name !== folder) errors.push(`name "${name ?? ''}" does not equal folder "${folder}"`);
    if (!description) errors.push('description is empty');
    else {
        if (description.length > 1024) errors.push(`description is ${description.length} characters (max 1024)`);
        if (!/use (when|on)/i.test(description)) errors.push('description lacks a "Use when" clause');
    }
    return { errors, warns };
}

export function ruleLength(text) {
    const p = parseFrontmatter(text);
    const body = p ? p.body : text;
    const n = body.replace(/\n$/, '').split('\n').length;
    return n > 300 ? [`body is ${n} lines (max 300)`] : [];
}

export function rulePaths(text, topLevel, exists) {
    return pathTokens(text)
        .filter((t) => topLevel.has(t.split('/')[0]))
        .filter((t) => !exists(t))
        .map((t) => `\`${t}\` does not exist`);
}

export function ruleEvals(data, order) {
    const e = [];
    if (!data || typeof data !== 'object' || Array.isArray(data)) return ['evals.json is not an object'];
    const known = (v) => typeof v === 'string' && order.includes(v);
    if (data.reviewed === undefined) e.push('reviewed is missing (use null)');
    else if (data.reviewed !== null) {
        const r = data.reviewed;
        if (!r || typeof r !== 'object') e.push('reviewed is neither null nor an object');
        else {
            if (typeof r.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.date) || isNaN(Date.parse(r.date))) {
                e.push('reviewed.date is not YYYY-MM-DD');
            }
            if (!known(r.model)) e.push(`reviewed.model "${r.model}" is not in roster order`);
            if (!known(r.floor)) e.push(`reviewed.floor "${r.floor}" is not in roster order`);
        }
    }
    if (!Array.isArray(data.triggers)) e.push('triggers is not an array');
    else {
        let yes = 0, no = 0;
        data.triggers.forEach((t, i) => {
            if (!t || typeof t.prompt !== 'string' || !t.prompt.trim() || typeof t.expect !== 'boolean') {
                e.push(`triggers[${i}] needs a prompt string and a boolean expect`);
            } else if (t.expect) yes++; else no++;
        });
        if (yes < 3) e.push(`triggers has ${yes} expect:true (min 3)`);
        if (no < 3) e.push(`triggers has ${no} expect:false (min 3)`);
    }
    if (!Array.isArray(data.tasks)) e.push('tasks is not an array');
    else {
        const ids = new Set();
        let holdout = 0;
        data.tasks.forEach((t, i) => {
            const at = `tasks[${i}]`;
            if (!t || typeof t !== 'object') { e.push(`${at} is not an object`); return; }
            if (typeof t.id !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t.id)) e.push(`${at}.id is not kebab-case`);
            else if (ids.has(t.id)) e.push(`${at}.id "${t.id}" is duplicated`);
            else ids.add(t.id);
            if (t.split !== 'dev' && t.split !== 'holdout') e.push(`${at}.split is not dev or holdout`);
            else if (t.split === 'holdout') holdout++;
            if (typeof t.prompt !== 'string' || !t.prompt.trim()) e.push(`${at}.prompt is empty`);
            if (!Array.isArray(t.checks) || !t.checks.length || t.checks.some((c) => typeof c !== 'string' || !c.trim())) {
                e.push(`${at}.checks must be a non-empty array of strings`);
            }
            if (typeof t.origin !== 'string' || !(t.origin === 'seed' || /^incident: \S/.test(t.origin))) {
                e.push(`${at}.origin is neither "seed" nor "incident: <line>"`);
            }
        });
        if (data.tasks.length < 2) e.push(`tasks has ${data.tasks.length} (min 2)`);
        if (!holdout) e.push('tasks has no holdout case');
    }
    return e;
}

export function ruleRegistered(name, skillsSection) {
    return skillsSection.includes('`' + name + '`') ? [] : [`\`${name}\` not named in AGENTS.md "## Skills"`];
}

export function ruleRoster(roster) {
    const e = [];
    if (!roster || typeof roster !== 'object') return ['roster.json is not an object'];
    for (const r of ROLES) if (typeof roster[r] !== 'string' || !roster[r]) e.push(`role "${r}" is missing`);
    if (!Array.isArray(roster.order)) e.push('order is not an array');
    else for (const r of ROLES) {
        if (roster[r] && !roster.order.includes(roster[r])) e.push(`order lacks ${r} alias "${roster[r]}"`);
    }
    return e;
}

/* ---------- due ---------- */

export function dueReasons(reviewed, planner, today, driftPaths, commitDate) {
    if (!reviewed) return ['never audited'];
    const out = [];
    const age = (Date.parse(today) - Date.parse(reviewed.date)) / 86400000;
    if (age > STALE_DAYS) out.push('stale');
    if (reviewed.model !== planner) out.push('model');
    for (const p of driftPaths) {
        const d = commitDate(p);
        if (d && d > reviewed.date) out.push(`drift: ${p}`);
    }
    return out;
}

/* ---------- self-test ---------- */

function selfTest() {
    const order = ['haiku', 'sonnet', 'opus', 'fable'];
    const goodFm = (n, d = 'Does a thing. Use when asked for a thing.') => `---\nname: ${n}\ndescription: ${d}\n---\nBody\n`;
    const trig = [true, true, true, false, false, false].map((x, i) => ({ prompt: 'p' + i, expect: x }));
    const task = (id, split) => ({ id, split, prompt: 'x', checks: ['node a.mjs'], origin: 'seed' });
    const goodEvals = () => ({ reviewed: null, triggers: trig.slice(), tasks: [task('a-b', 'dev'), task('c', 'holdout')] });
    const goodRoster = () => ({ planner: 'fable', orchestrator: 'opus', executor: 'sonnet', scout: 'haiku', order });
    const top = new Set(['tools', 'docs']);
    const has = (p) => p === 'tools/lint-skills.mjs';
    const sec = 'Playbooks: `good`, `other`.';
    const bad = (e) => e.errors ? e.errors : e;

    const cases = [
        ['valid frontmatter', bad(ruleFrontmatter(goodFm('good'), 'good')), false],
        ['folded description parses', bad(ruleFrontmatter('---\nname: good\ndescription: >\n  Does a thing\n  across lines. Use when asked.\n---\nB', 'good')), false],
        ['name mismatch', bad(ruleFrontmatter(goodFm('nope'), 'good')), true],
        ['no frontmatter', bad(ruleFrontmatter('# hi', 'good')), true],
        ['empty description', bad(ruleFrontmatter('---\nname: good\ndescription:\n---\nB', 'good')), true],
        ['description too long', bad(ruleFrontmatter(goodFm('good', 'Use when ' + 'x'.repeat(1030)), 'good')), true],
        ['no Use when', bad(ruleFrontmatter(goodFm('good', 'Does a thing.'), 'good')), true],
        ['length ok', ruleLength(goodFm('good') + 'l\n'.repeat(100)), false],
        ['length over', ruleLength(goodFm('good') + 'l\n'.repeat(301)), true],
        ['paths ok', rulePaths('see `tools/lint-skills.mjs` and `a/b` and `x`', top, has), false],
        ['paths missing', rulePaths('see `tools/nope.mjs`', top, has), true],
        ['evals ok', ruleEvals(goodEvals(), order), false],
        ['evals reviewed ok', ruleEvals({ ...goodEvals(), reviewed: { date: '2026-11-10', model: 'fable', floor: 'sonnet' } }, order), false],
        ['evals bad floor', ruleEvals({ ...goodEvals(), reviewed: { date: '2026-11-10', model: 'fable', floor: 'gpt' } }, order), true],
        ['evals few negatives', ruleEvals({ ...goodEvals(), triggers: trig.slice(0, 4) }, order), true],
        ['evals no holdout', ruleEvals({ ...goodEvals(), tasks: [task('a', 'dev'), task('b', 'dev')] }, order), true],
        ['evals duplicate id', ruleEvals({ ...goodEvals(), tasks: [task('a', 'dev'), task('a', 'holdout')] }, order), true],
        ['evals empty checks', ruleEvals({ ...goodEvals(), tasks: [{ ...task('a', 'dev'), checks: [] }, task('b', 'holdout')] }, order), true],
        ['evals unparsed', ruleEvals(null, order), true],
        ['registered ok', ruleRegistered('good', sec), false],
        ['registered missing', ruleRegistered('absent', sec), true],
        ['roster ok', ruleRoster(goodRoster()), false],
        ['roster missing role', ruleRoster({ ...goodRoster(), scout: undefined }), true],
        ['roster order incomplete', ruleRoster({ ...goodRoster(), order: ['haiku', 'sonnet'] }), true],
        ['due never', dueReasons(null, 'fable', '2026-11-10', [], () => null), true],
        ['due stale', dueReasons({ date: '2026-01-01', model: 'fable' }, 'fable', '2026-11-10', [], () => null), true],
        ['due model', dueReasons({ date: '2026-11-01', model: 'opus' }, 'fable', '2026-11-10', [], () => null), true],
        ['due drift', dueReasons({ date: '2026-11-01', model: 'fable' }, 'fable', '2026-11-10', ['tools/x'], () => '2026-11-05'), true],
        ['due clean', dueReasons({ date: '2026-11-01', model: 'fable' }, 'fable', '2026-11-10', ['tools/x'], () => '2026-10-05'), false],
    ];
    let wrong = 0;
    for (const [label, res, shouldFail] of cases) {
        if ((res.length > 0) !== shouldFail) { console.log(`self-test: ${label}: expected ${shouldFail ? 'failure' : 'pass'}, got ${JSON.stringify(res)}`); wrong++; }
    }
    // Third-party handling: only a missing "Use when" is a warning.
    const tp = ruleFrontmatter(goodFm('p', 'No trigger clause.'), 'p');
    const f = splitThirdParty(tp);
    if (f.errors.length || f.warns.length !== 1) { console.log('self-test: third-party warning split wrong'); wrong++; }
    console.log(wrong ? `self-test: ${wrong} wrong of ${cases.length + 1}` : `self-test: ${cases.length + 1} checks ok`);
    return wrong ? 1 : 0;
}

// Third-party skills: the "Use when" miss is a warning, other frontmatter faults stay errors.
function splitThirdParty({ errors }) {
    const warns = errors.filter((x) => x.includes('"Use when"'));
    return { errors: errors.filter((x) => !warns.includes(x)), warns };
}

/* ---------- filesystem run ---------- */

const read = (rel) => { try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch { return null; } };
const readJson = (rel) => { const t = read(rel); if (t === null) return { missing: true }; try { return { data: JSON.parse(t) }; } catch (err) { return { error: err.message }; } };

function main(argv) {
    if (argv.includes('--self-test')) return selfTest();
    const due = argv.includes('--due');

    const tpDoc = read('.claude/skills/THIRD_PARTY_SKILLS.md') || '';
    const thirdParty = new Set([...tpDoc.matchAll(/`([\w.-]+)\/`/g)].map((m) => m[1]));
    const folders = fs.existsSync(SKILLS)
        ? fs.readdirSync(SKILLS, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()
        : [];
    const house = folders.filter((f) => !thirdParty.has(f));
    const topLevel = new Set(fs.readdirSync(ROOT));
    const exists = (p) => fs.existsSync(path.join(ROOT, p));

    const rosterRes = readJson('.claude/skills/skillsmith/roster.json');
    const roster = rosterRes.data;
    const order = roster && Array.isArray(roster.order) ? roster.order : [];

    if (due) {
        const today = new Date().toISOString().slice(0, 10);
        const commitDate = (p) => {
            try { return execFileSync('git', ['log', '-1', '--format=%cs', '--', p], { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || null; }
            catch { return null; }
        };
        let any = false;
        for (const s of house) {
            const ev = readJson(`.claude/skills/${s}/evals.json`).data;
            const reviewed = ev && ev.reviewed !== undefined ? ev.reviewed : null;
            const skillText = read(`.claude/skills/${s}/SKILL.md`) || '';
            const cited = pathTokens(skillText).filter((t) => topLevel.has(t.split('/')[0]) && exists(t));
            const why = dueReasons(reviewed, roster && roster.planner, today, cited, commitDate);
            if (why.length) { any = true; console.log(`${s}: ${why.join(', ')}`); }
        }
        if (!any) console.log('no skill is due');
        return 0;
    }

    const findings = [];
    const add = (skill, rule, details) => details.forEach((d) => findings.push({ skill, rule, detail: d }));
    let warnings = 0;

    const agents = read('AGENTS.md') || '';
    const sm = /^## Skills[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(agents);
    const skillsSection = sm ? sm[1] : '';

    if (rosterRes.missing) add('skillsmith', 'roster', ['.claude/skills/skillsmith/roster.json is missing']);
    else if (rosterRes.error) add('skillsmith', 'roster', ['roster.json does not parse: ' + rosterRes.error]);
    else add('skillsmith', 'roster', ruleRoster(roster));

    for (const s of folders) {
        const third = thirdParty.has(s);
        const text = read(`.claude/skills/${s}/SKILL.md`);
        if (text === null) { add(s, 'frontmatter', ['SKILL.md is missing']); continue; }
        let fmRes = ruleFrontmatter(text, s);
        if (third) {
            fmRes = splitThirdParty(fmRes);
            for (const w of fmRes.warns) { console.log(`${s}: frontmatter: warning: ${w}`); warnings++; }
        }
        add(s, 'frontmatter', fmRes.errors);
        if (third) continue;

        add(s, 'length', ruleLength(text));
        add(s, 'paths', rulePaths(text, topLevel, exists));
        const refDir = path.join(SKILLS, s, 'reference');
        if (fs.existsSync(refDir)) {
            for (const f of fs.readdirSync(refDir).filter((n) => n.endsWith('.md')).sort()) {
                add(s, 'paths', rulePaths(read(`.claude/skills/${s}/reference/${f}`) || '', topLevel, exists).map((d) => `reference/${f}: ${d}`));
            }
        }
        const ev = readJson(`.claude/skills/${s}/evals.json`);
        if (ev.missing) add(s, 'evals', ['evals.json is missing']);
        else if (ev.error) add(s, 'evals', ['evals.json does not parse: ' + ev.error]);
        else add(s, 'evals', ruleEvals(ev.data, order));
        add(s, 'registered', ruleRegistered(s, skillsSection));
    }

    for (const f of findings) console.log(`${f.skill}: ${f.rule}: ${f.detail}`);
    if (!findings.length) console.log(`lint-skills: ${house.length} house and ${folders.length - house.length} third-party skills clean` + (warnings ? ` (${warnings} warning)` : ''));
    return findings.length ? 1 : 0;
}

process.exit(main(process.argv.slice(2)));
