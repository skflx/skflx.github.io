# Quiz-prep pipeline: one guide and one module per quiz session

- **Status**: Decided (grill rounds 1 and 2, §7). Playbook: `.claude/skills/quiz-prep/SKILL.md`.
- **Created**: 2026-11-25
- **Schedule**: the RR quiz sessions (Mondays). Work on a topic starts the Monday a week before its quiz.
- **First run**: Hargunani, Cholesteatoma and chronic ear, quiz Mon 11/30.

## 1. Objective

A reproducible path from "here are my sources" to a vetted study unit in under a week, without the
per-topic planning apparatus of the last two guides. Each quiz gets:

- **one guide** (the lesson): first-pass teaching with retrieval prompts, and the board-style questions
  answered in place (`practice` blocks);
- **one companion module** (the Qs on their own): the same questions with the locked first attempt and
  spaced repetition, reachable from the hub and from every section's drill row;
- links to the matching **sk.oto** notes (section `ref` rows) and map (top bar).

This is the mechanism that already exists. The pipeline adds no engine, block type or tool.

## 2. What exists, by quiz

| Quiz (faculty) | Content | Shape |
|---|---|---|
| Lip reconstruction (Krane) | `lip-reconstruction` | module only |
| Otoplasty (Wang) | `otoplasty` | module only, source figures |
| Facial analysis (Loyo) | `facial-analysis` | module only, source figures |
| Orbital / midface trauma (Engelstad) | `midface-fractures`, `orbit-noe-trauma`, `mandible-fractures`, `facial-trauma-evaluation` | four modules from decks |
| AERD and biologics (Detwiller) | guide `ar-crs-aerd` over `aerd-biologics`, `crs-ars`, `allergy-testing` | guide over three modules |
| Normal ear anatomy (Hullar) | guide + module `ear-anatomy` | guide + one companion module |
| Abnormal ear anatomy (Hullar) | none | gap |
| IAC / CPA (Gantz) | guide + module `iac-anatomy`, plus `vestibular-schwannoma` | guide + companion, full plan apparatus |

Three generations, measured from the data files:

| | Gen 1: module only | Gen 2: `ar-crs-aerd` | Gen 3: `ear-anatomy`, `iac-anatomy` |
|---|---|---|---|
| Teaching | none (explanations only) | 11 chapters, 54 sections | 9 to 14 chapters, 54 to 68 sections |
| Questions in the lesson | n/a | `check` prompts + `practice` refs into three modules | `check` prompts + `practice` refs into one companion |
| Module size | 24 to 64 items | 62 to 96 per module | 136 to 147 |
| Recall share | 0 to 32 % | 16 to 86 % | 10 to 36 % |
| Synthesis cases | 3 to 5 in most | 0 to 4 | 0 (ear), 6 (IAC) |
| sk.oto | top-bar map | section `ref` rows (backfilled) | section `ref` rows |
| Process | one pass from decks | one pass | ear: 880-line spec; IAC: 500-line spec, ledger, handoff, 8 chapter briefs, 9 figure geometry specs, serial Gemini queue, 4 content PRs |

Gen 3 is the right product and the wrong process for a weekly quiz: the IAC apparatus took a week of
waves for one topic. Gen 1 was fast but has no lesson.

## 3. Adopt as the standard

From the guides (Gen 2 and 3):

1. **Guide + one companion module, one concept per guide section**, so every section's drill row
   points at exactly its own questions (ear, IAC). Not three modules per guide (Gen 2).
2. **Every section ends**: 2 to 3 `check` prompts, then a `practice` block of 1 to 3 module items, then
   the `drill` row. That is what puts the Qs inside the lesson while the module keeps them standalone.
3. **`tldr` of 3 to 6 bullets** opening every chapter, and a `src` line naming its sources.
4. **Section `ref` rows to sk.oto notes** (validated against `tools/skoto-notes.json`; refresh it
   with `node tools/skoto-notes.mjs` when the wiki has new notes), plus the top-bar map link.
5. **Source conflicts shown, not averaged**: a `trap` callout labelled "Source conflict" in the guide,
   **Discrepancy:** / **Caveat:** in item explanations.
6. **Practice refs into existing modules** where a fact is already an item (for this topic:
   `ear-anatomy` spaces, mastoid and Eustachian tube; `temporal-bone-trauma`), instead of a duplicate.

From the modules (Gen 1):

7. **Synthesis cases** close every module (3 to 4 `case-*` sequences; one whose naive answer is wrong).
   The ear module has none; this becomes required.
8. **Recall about 20 %**, MCQ the rest; **"added"** marks standard teaching the sources do not state.
9. **Sized to the quiz**: 3 to 5 chapters, 15 to 25 sections, a module of 40 to 70 items.

From the IAC review wave:

10. **One content review pass** against the three things that review fixed: traceability (every claim
    to a named source), pearls (every `detailed` ends on one), distractors (from neighbouring lists).

## 4. Drop for quiz topics

- The per-topic spec, ledger, handoff and per-chapter briefs as separate files: they collapse into one
  quiz brief, `plans/quiz/<YYYY-MM-DD>-<slug>.md` from `plans/quiz/TEMPLATE.md`.
- GitHub sub-issues per WP.
- The appraisal chapter, unless the faculty assigned papers.

Kept (owner, round 1): **Claude and Gemini in tandem** (division of labour in §5), and
**figures**: textbook figures first; a bespoke SVG only for a special case no source figure shows.

## 5. The pipeline

One thread, one brief, one GitHub issue (steps as its task list), two executor PRs per quiz. Day 0 is
the Monday a week before the quiz. The step table and the executor protocol are in
`.claude/skills/quiz-prep/SKILL.md`; in short: intake (owner) → source map and grill (orchestrator) →
brief → step A (Hydrogen) → spot-check (orchestrator) → step B (Hydrogen) → other-family review →
merge with `draft: true` (owner).

**Roles.** Orchestrator: Opus, or a frontier Gemini (Neon, Argon, Carbon are interchangeable by price).
Executor: Hydrogen. Reviewer: a frontier model of the other family. Sonnet or a frontier Gemini at low
effort: mechanical sessions, and the executor's stand-in. The judgment (source reading, keying, the
brief) stays with the orchestrator; delegation saves the writing and verification loop.

Sources rank, for keying an answer: **the faculty's own material** (what the quiz writer teaches) >
board-review text > the RR deck > vault notes. Anything no source states is checked on PubMed or the web
and recorded in `meta.sources`, or labelled "added".

## 6. Verification (unchanged; listed here so the playbook is one page)

```bash
node tools/check-data.mjs
node tools/lint-oksat.mjs <slug>
node tools/lint-oksat-guide.mjs <slug>
node tools/test-oksat-learn.mjs
node tools/test-oksat-engine.mjs
node tools/smoke-pages.mjs
```

## 7. Decisions

Round 1 (owner, 2026-11-25): yes to 1 and 3 to 8. On 2: yes, and a topic that is naturally bigger may
expand after asking. Two amendments: Gemini waves stay (division of labour, round 2) and bespoke figures stay
for special cases (§4).

Round 2 (owner, 2026-11-25): Neon, Argon and Carbon are comparable frontier tiers, swapped by price;
Hydrogen is the cheap executor. Yes to: Opus orchestrates, Hydrogen executes, other family reviews; one
brief file per quiz; two steps with a spot-check between and one review at the end; one issue per quiz;
special-case SVGs approved in the grill; Sonnet, Argon, Carbon for mechanical work and fallback. The split
is piloted on Hargunani now, timing each step.

1. Unit: guide + one companion module per quiz.
2. Size: 3 to 5 chapters, module 40 to 70 items.
3. Process: §4 drops apply to quiz topics.
4. Where to codify: one short `quiz-prep` skill as the entry point, calling `/oksat-guide` and
   `/oksat-module`; adopted standards edited into those two skills, not duplicated.
5. Source ranking: faculty material first (§5).
6. Gen 1 modules stay module-only unless the owner asks for a guide.
7. Ship with `draft: true` on Day 3; vetting continues live.
8. Hargunani: the child-versus-adult contrast as a comparison table in every chapter plus paired
   child and adult synthesis cases, not a separate chapter.

## 8. Codified

- `.claude/skills/quiz-prep/SKILL.md` (order of work, roles, executor prompt and protocol);
  `plans/quiz/TEMPLATE.md` (the brief).
- `/oksat-guide` and `/oksat-module` carry the general rules (one companion module per guide, a concept
  per section, the section ending, required cases, the content review pass).

## 9. Hargunani draft outline (pending sources)

Slug `cholesteatoma-chronic-ear` (otology), guide and module. Chapters, each with a child-versus-adult table:

1. **Pathogenesis and classification**: congenital vs primary acquired (pars flaccida, Prussak space)
   vs secondary acquired; COM without cholesteatoma; retraction staging.
2. **Evaluation**: otomicroscopy, audiometry, CT, non-EPI DWI.
3. **Surgery**: tympanoplasty (underlay, overlay, cartilage), canal wall up vs down, ossiculoplasty,
   second look vs DWI surveillance, staging and timing.
4. **Complications**: intratemporal (fistula, facial nerve, mastoiditis) and intracranial.
5. **Synthesis cases** (module only): paired child and adult presentations of the same disease.
