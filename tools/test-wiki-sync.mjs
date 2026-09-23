#!/usr/bin/env node
/* =============================================================
   test-wiki-sync.mjs — behavior tests for wiki/sync/sync-vault.mjs,
   the privacy boundary between the sk.oto vault and the web.

   Builds a synthetic vault in a temp dir (no real notes are ever
   committed), runs the sync, and asserts what did and did not
   leave. Pure Node, zero deps. Usage: node tools/test-wiki-sync.mjs
   ============================================================= */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(ROOT, 'wiki/sync/sync-vault.mjs');
const { stripSections, unlinkMissing, splitFrontmatter } = await import(SCRIPT);

let failures = 0, checks = 0;
function ok(cond, msg) { checks++; if (cond) console.log('  PASS  ' + msg); else { failures++; console.log('  FAIL  ' + msg); } }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-sync-'));
const vault = path.join(tmp, 'sk.oto');
const out = path.join(tmp, 'site', 'content');
function put(rel, text) { const p = path.join(vault, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); }
const fm = (extra = '') => `---\ntitle: "T"\ntier: "Tier I: Bedrock"\ntags:\n  - otology\nlast_revised: 2026-09-01\nvetted: ""\nstatus: complete\npersonal_status: raw\naliases:\n  - "Alias One"\n${extra}---\n`;

put('Otology/Alpha note states a fact.md', fm() + `
# Alpha note states a fact

## Active Recall
> [!question]- Why?
> *Answer*: because.

## Personal Notes
\`\`\`
my private jotting about a hard day
## not a real heading, inside the fence
\`\`\`

## Core Clinical & Mechanistic Principles
See [[Beta note states a fact|beta]], [[Gamma draft note|gamma]], [[Secret source|KJ]] and ![[Hidden embed]].

| A | B |
| - | - |
| x | [[Beta note states a fact\\|beta in table]] |

Also [[Alias One]] resolves by alias.
`);
put('Otology/Beta note states a fact.md', fm().replace('vetted: ""', 'vetted: "2026-09-10"').replace('title: "T"', 'title: "Beta note states a fact"') + '\n# Beta note states a fact\n\nBody.\n');
put('Otology/Gamma draft note.md', fm().replace('status: complete', 'status: stub') + '\n# Gamma draft note\n');
put('Otology/Delta flagged draft.md', fm('draft: true\n') + '\n# Delta\n');
put('Otology/Patient case.md', fm() + '\n# Patient case\n\nMRN 12345678 seen in clinic.\n');
put('Otology/_inbox/scratch.md', fm() + '\n# scratch\n');
put('Otology/diagram.png', 'not really a png');
put('data_sources/KJLee.md', '# copyrighted textbook text\n');
put('_drafts/Incubating.md', fm() + '\n# Incubating\n');
put('.obsidian/workspace.json', '{}');
put('AGENTS.md', '# rules\n');
put('MOC.md', '# Master map\n\n[[Alpha note states a fact]] · [[Secret source]]\n');
fs.symlinkSync(path.join(vault, 'data_sources'), path.join(vault, 'Otology', 'linked-sources'));

console.log('\nwiki/sync/sync-vault.mjs');

/* dry run writes nothing */
let r = spawnSync(process.execPath, [SCRIPT, '--vault', vault, '--out', out, '--quiet'], { encoding: 'utf8' });
ok(!fs.existsSync(out), 'dry run (default) writes nothing');
ok(r.status === 2, 'exit code 2 when a note is held for review');

r = spawnSync(process.execPath, [SCRIPT, '--vault', vault, '--out', out, '--write', '--quiet', '--report', path.join(tmp, 'report.json')], { encoding: 'utf8' });
const rep = JSON.parse(fs.readFileSync(path.join(tmp, 'report.json'), 'utf8'));
const listed = [];
(function list(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? list(p) : listed.push(path.relative(out, p)); } })(out);

ok(listed.includes('Otology/Alpha note states a fact.md') && listed.includes('Otology/Beta note states a fact.md'), 'complete notes in allowlisted folders are published');
ok(listed.includes('MOC.md'), 'root MOC.md is published');
ok(!listed.some((f) => /KJLee|data_sources|linked-sources/.test(f)), 'data_sources/ never leaves (also not via symlink)');
ok(!listed.some((f) => /_drafts|Incubating|_inbox|scratch/.test(f)), '_drafts/ and _-prefixed folders never leave');
ok(!listed.some((f) => /AGENTS|\.obsidian|workspace/.test(f)), 'governance docs and .obsidian never leave');
ok(!listed.some((f) => f.endsWith('.png')), 'non-markdown files are not copied');
ok(!listed.some((f) => /Gamma|Delta/.test(f)), 'status: stub and draft: true are gated');
ok(!listed.some((f) => /Patient case/.test(f)) && rep.held.length === 1, 'PHI tripwire holds the note back');

const alpha = fs.readFileSync(path.join(out, 'Otology/Alpha note states a fact.md'), 'utf8');
ok(!/private jotting|Personal Notes|not a real heading/.test(alpha), 'Personal Notes section removed, fence-aware');
ok(/## Core Clinical/.test(alpha) && /## Active Recall/.test(alpha), 'other sections kept');
ok(!/personal_status/.test(alpha), 'personal_status dropped from frontmatter');
ok(/\[\[Beta note states a fact\|beta\]\]/.test(alpha), 'links to published notes kept');
ok(/\bgamma\b/.test(alpha) && !/\[\[Gamma/.test(alpha) && !/\[\[Secret source/.test(alpha), 'links to unpublished notes become plain text');
ok(!/Hidden embed/.test(alpha), 'embeds of unpublished notes removed');
ok(/\[\[Beta note states a fact\\\|beta in table\]\]/.test(alpha), 'table-escaped pipe links kept intact');
ok(/\[\[Alias One\]\]/.test(alpha), 'links resolving through an alias kept');
ok(/- unvetted/.test(alpha) && /\[!warning\] Unvetted/.test(alpha), 'unvetted note tagged and flagged');
const beta = fs.readFileSync(path.join(out, 'Otology/Beta note states a fact.md'), 'utf8');
ok(!/^# Beta note/m.test(beta) && /^# Alpha note/m.test(alpha), 'H1 dropped only when it repeats the frontmatter title');
ok(!/Unvetted/.test(beta), 'vetted note carries no warning');
ok(!/\[\[Secret source/.test(fs.readFileSync(path.join(out, 'MOC.md'), 'utf8')), 'MOC links to private notes unlinked');

/* ownership: a stale file we wrote is removed; a foreign one is never touched */
fs.unlinkSync(path.join(vault, 'Otology/Beta note states a fact.md'));
fs.writeFileSync(path.join(out, 'hand-written.md'), '# mine\n');
spawnSync(process.execPath, [SCRIPT, '--vault', vault, '--out', out, '--write', '--quiet'], { encoding: 'utf8' });
ok(!fs.existsSync(path.join(out, 'Otology/Beta note states a fact.md')), 'notes removed from the vault disappear on the next sync');
ok(fs.existsSync(path.join(out, 'hand-written.md')), 'files the script did not write are left alone');

const foreign = path.join(tmp, 'someone-else');
fs.mkdirSync(foreign); fs.writeFileSync(path.join(foreign, 'keep.md'), 'x');
r = spawnSync(process.execPath, [SCRIPT, '--vault', vault, '--out', foreign, '--write', '--quiet'], { encoding: 'utf8' });
ok(r.status === 1 && fs.readdirSync(foreign).length === 1, 'refuses a non-empty folder it did not create');
r = spawnSync(process.execPath, [SCRIPT, '--vault', vault, '--out', path.join(vault, 'Otology'), '--write', '--quiet'], { encoding: 'utf8' });
ok(r.status === 1, 'refuses an output folder inside the vault');

/* unit edges */
ok(stripSections('## Personal Notes\n~~~\n## x\n~~~\n## Next\nkeep', ['Personal Notes']).body === '## Next\nkeep', 'stripSections handles ~~~ fences');
ok(unlinkMissing('[[Missing#Heading]]', new Set()).body === 'Missing › Heading', 'heading links fall back to readable text');
ok(splitFrontmatter('no frontmatter').fm === null, 'files without frontmatter parse');

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${failures ? 'FAILED' : 'OK'} — ${checks - failures}/${checks} checks passed.`);
process.exit(failures ? 1 : 0);
