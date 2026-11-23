---
name: gemini-delegate
description: Hand a work package (WP) or a read-only task from a Claude session to Gemini CLI, headless, and review what comes back. Use when the owner says to delegate to Gemini, run a WP on Gemini, or get a Gemini second opinion or review, and the work is delegable per docs/delegation.md §1.
---

# Delegate to Gemini (headless)

Protocol: `docs/delegation.md` §9. Claude here is the **orchestrator**: it writes the brief, runs the wrapper,
checks the result, and commits. Gemini is the **executor**, or the **reviewer** in read mode.

## Before you start

1. Is it delegable (`docs/delegation.md` §1)? Anatomy already data, acceptance is a command, no open owner
   decision, read list short. If not, do it yourself or split it.
2. Is Gemini reachable? `gemini --version` (or `GEMINI_BIN="npx -y @google/gemini-cli"`), and an auth path
   (`GEMINI_API_KEY`, or a cached login). In a cloud session the host `generativelanguage.googleapis.com` must be
   on the environment's allowlist. If any is missing, say so and stop; do not substitute another model.

## Work mode (edits)

1. Write the brief in the WP format (`docs/delegation.md` §2) to the scratchpad, **not the repo**. `Touch:` must list
   backticked paths, globs, or directories ending in `/`; the wrapper refuses a brief without it and rejects any
   changed file outside it. Put the judgment in the brief (data, ids, numbers); Gemini adds nothing it does not state.
2. `node tools/gemini-run.mjs <brief.md>`. It runs in a throwaway worktree under `.claude/worktrees/` with
   `--approval-mode yolo`, so the blast radius is that worktree. Commit what the brief needs first: the worktree
   starts from `HEAD`.
3. Exit 3 means **REVIEW BEFORE APPLYING**: read each line (outside Touch, Gemini committed). Do not apply a patch
   with an unexplained violation.
4. Review the patch as a checkpoint (`docs/delegation.md` §4): read the diff against Accept and the brief. Do not
   trust the pasted test tails; run the Accept commands yourself in the worktree
   (`git -C <worktree> ...` or `cd` there; `node_modules` is linked).
5. Apply with the printed `git apply --3way <patch>` on your branch, run `node tools/stamp-assets.mjs` if `css/`
   or `js/` changed, then `check-data` and the subsystem suite, then commit (one short line, no trailers) and clean
   up with the printed command.
6. If the reply starts `BLOCKED:`, escalate per the WP's Escalate line; do not rephrase the brief to get past it.

## Read mode (review, research, drafting)

`node tools/gemini-run.mjs <brief.md> --mode read` runs `--approval-mode plan` in this checkout and reports a
changed tree. Use it for an adversarial review of a diff (name the diff and the spec in the brief; ask for
`block`/`fix`/`nit` findings with `file:line` and a failure scenario, `docs/delegation.md` §7) or a second opinion.
Treat its findings as claims to verify, not as facts.

## Never

Anatomy or clinical content that is not already data; marking anything `verified`; changing a plan's contracts;
`--yolo` outside the wrapper's worktree; letting Gemini commit or push; putting a key in a brief.
