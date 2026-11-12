# Plans

Specs for implementation plans, one Markdown file each (`plans/<YYYY-MM-DD>-<task-name>.md`):
decisions, contracts and data that every agent reads offline, changed only through PRs. Status never
lives here: each spec has a parent GitHub issue, with one sub-issue per work package (see `AGENTS.md`).

| Spec | Subject | Parent issue |
|---|---|---|
| [2026-11-02-ear-anatomy-guide](2026-11-02-ear-anatomy-guide.md) | normal outer and middle ear: OKSAT guide and question module | #206 |
| [2026-11-03-uw-temporal-bone-volume](2026-11-03-uw-temporal-bone-volume.md) | internal 3D reference volume from the UW temporal bone atlas | #225 |
| [2026-11-04-skoto-links](2026-11-04-skoto-links.md) | OKSAT modules and guides linked to sk.oto maps, gated by `live` | #174 |
| [2026-11-04-tbone-sources](2026-11-04-tbone-sources.md) | real-DICOM temporal bone sources beyond the UW atlas | #244 |
| [2026-11-09-ear-truth-concordance](2026-11-09-ear-truth-concordance.md) | OLSB checked against the real temporal bone CT; one volume contract with SSB | #247 |
| [2026-11-10-ssb-nasal-framework](2026-11-10-ssb-nasal-framework.md) | SSB `nasal-framework` diorama spec | #267 |
| [2026-11-10-jc-whisking-auditory-cortex](2026-11-10-jc-whisking-auditory-cortex.md) | journal-club OKSAT guide on auditory cortex and whisking movements | none |
| [2026-10-07-ssb-roadmap](2026-10-07-ssb-roadmap.md) | SSB decisions, work package specs, review links, content backlog | #266 |
| [2026-11-10-skillsmith](2026-11-10-skillsmith.md) | a skill that writes, audits and prunes skills against evals; lint in CI | #263 |
