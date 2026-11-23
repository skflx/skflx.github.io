#!/usr/bin/env node
/* =============================================================
   skoto-notes.mjs — snapshot the note list of skflx/ohns-wiki-skflx.

   Lists content/<path>.md (without content/ prefix or .md suffix),
   sorted lexicographically, and writes tools/skoto-notes.json.

   Usage:
     node tools/skoto-notes.mjs [local-wiki-repo-path]
   ============================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'skoto-notes.json');
const REPO = 'skflx/ohns-wiki-skflx';

function walkMarkdown(dir, prefix, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
    if (ent.isDirectory()) walkMarkdown(path.join(dir, ent.name), rel, out);
    else if (ent.isFile() && ent.name.endsWith('.md')) out.push(rel.slice(0, -3));
  }
}

async function fetchTree() {
  try {
    const raw = execFileSync('gh', ['api', `repos/${REPO}/git/trees/HEAD?recursive=1`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return JSON.parse(raw);
  } catch {
    const res = await fetch(`https://api.github.com/repos/${REPO}/git/trees/HEAD?recursive=1`, {
      headers: { 'User-Agent': 'skflx-skoto-notes' },
    });
    if (!res.ok) throw new Error(`GitHub API HTTP ${res.status}`);
    return res.json();
  }
}

async function main() {
  const localArg = process.argv[2];
  let notes = [];
  if (localArg) {
    const contentDir = path.resolve(localArg, 'content');
    if (!fs.existsSync(contentDir)) {
      console.error(`Content directory not found: ${contentDir}`);
      process.exit(1);
    }
    walkMarkdown(contentDir, '', notes);
  } else {
    const tree = await fetchTree();
    if (tree.truncated) {
      console.error('GitHub git tree response was truncated; pass a local clone path instead.');
      process.exit(1);
    }
    notes = (tree.tree || [])
      .filter((t) => t.type === 'blob' && t.path.startsWith('content/') && t.path.endsWith('.md'))
      .map((t) => t.path.slice('content/'.length, -'.md'.length));
  }
  notes.sort();
  const payload = {
    generated: new Date().toISOString().slice(0, 10),
    notes,
  };
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${notes.length} notes to ${path.relative(process.cwd(), OUT)}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
