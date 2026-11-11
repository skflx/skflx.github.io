# Plans

Specs for implementation plans, one Markdown file each (`plans/<YYYY-MM-DD>-<task-name>.md`):
decisions, contracts and data that every agent reads offline and that change only through PRs.
Status never lives here: each spec has a parent GitHub issue with one sub-issue per work package
(see `AGENTS.md`).

| Spec | Parent issue |
|---|---|
| [2026-10-28-figures-eggs-atlas](2026-10-28-figures-eggs-atlas.md): ASCII figures as eggs, unlisted atlas (lit 3D Figs 1–2 dropped) | #176 (closed) |
| [2026-11-02-ear-anatomy-guide](2026-11-02-ear-anatomy-guide.md): normal outer and middle ear, OKSAT guide + question module, listed as Draft | #206 (closed; #237 removes Draft) |
| [2026-11-03-uw-temporal-bone-volume](2026-11-03-uw-temporal-bone-volume.md): internal 3D reference volume from the UW temporal bone atlas | #225 (closed; follow-on #244) |
| [2026-11-04-skoto-links](2026-11-04-skoto-links.md): link OKSAT modules and guides to sk.oto maps, gated by `live`; implemented and live (`live: true`, amended 2026-11-10) | #174 |
| [2026-11-04-skoto-publish](2026-11-04-skoto-publish.md): publish sk.oto with every figure stripped, three locks | #243 |
| [2026-11-04-tbone-sources](2026-11-04-tbone-sources.md): real-DICOM temporal bone sources beyond the UW atlas | #244 |
| [2026-11-09-ear-truth-concordance](2026-11-09-ear-truth-concordance.md): OLSB shows and is checked against the real temporal bone CT; one volume contract with SSB | #247 |
| [2026-11-10-ssb-nasal-framework](2026-11-10-ssb-nasal-framework.md): SSB `nasal-framework` diorama spec (ST7), moved from `docs/ssb.md` §6.2; not built | #267 (under #266) |
| [2026-11-10-jc-whisking-auditory-cortex](2026-11-10-jc-whisking-auditory-cortex.md): journal-club OKSAT guide on Zimmer-Harwood et al. 2026 (auditory cortex, spontaneous vs sound-evoked movements), listed as Draft | none (built in one session; the PR is the record) |
| [2026-10-07-ssb-roadmap](2026-10-07-ssb-roadmap.md): SSB (sinus and skull base 3D) decisions, work package specs, owner review links, content backlog; moved from `docs/ssb-roadmap.md` 2026-11-11 | #266 |
