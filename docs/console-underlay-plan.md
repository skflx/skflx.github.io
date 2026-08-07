# Console underlay + the due-count reframe

> Snapshot date: 2026-07-27. Status: **brainstorm / pre-build.** The console is
> a decided direction (owner, 2026-07-27); the reframe below is proposed and
> the open questions in §5 are unanswered.

Working prototype (press ⌘K inside the frame — it is real, not a picture):
<https://claude.ai/code/artifact/b512648f-4fb5-427d-87a8-6625768dea21>

## 1. The reframe — and what it retracts

The owner reviews **periodically, not daily**. That single fact invalidates an
assumption baked into the product backlog:

- `docs/feature-requests.md` **#12** proposed "continue where you left off **+
  daily streak**". A streak shown to a periodic user is a guilt counter sitting
  at zero — it punishes exactly the described behaviour. **Drop the streak.**
- **#1** framed the cross-module queue as "the core loop that degrades every
  single day". The machinery is still right; the framing is not. **Re-scope to
  an on-demand "start a session"** — same engineering, no daily obligation, no
  badge.

The general rule that falls out of this, worth keeping:

> **Due-ness is an input to the algorithm, never a number shown on the front
> page.** No badges on cards, no counters in the topbar, no streak. At most one
> quiet line inside the session control itself.

## 2. What organises the site instead

Six candidate spines. They are not mutually exclusive; the recommendation is a
combination.

| Spine | What it makes easy | Verdict |
|---|---|---|
| **Coverage** — what exists, what you've seen, what's unbuilt | Honest about the content gap; progress reads as territory, not debt | **Recommended base** |
| **Recency** — where you left off, plus starred | Zero maintenance, zero guilt; works identically at daily or monthly cadence | **Recommended companion** (already the console's empty state) |
| **Weakness** — the miss log up front | For periodic use, "the twelve you actually missed" beats "80 scheduled cards" | **Recommended** — data already collected (backlog #3) |
| **Session-on-demand** — one "give me twenty" control | Keeps spaced repetition without the standing debt | **Recommended** for the queue |
| **Anatomy / region** — ear, nose, larynx, neck, skull base | Matches clinical thinking; fits the structural lens | Alternative — creates a second taxonomy competing with subspecialty markers |
| **Reference-first** — search over study | The console already delivers most of it | Alternative — risks making modules feel secondary |

## 3. What the console is

An **underlay**: not a page, a layer every page carries. Same index, same keys,
same results everywhere.

| Aspect | Decision |
|---|---|
| Opens with | ⌘K / Ctrl K, `/` when not typing, **and a visible topbar button** — the button is the only discoverable part and matters more than the shortcut |
| Indexes | Modules + concepts (manifest + module files), graph nodes (`data/kag-graph.json`), CPT codes, pages, commands. All already loaded or fetchable — no new data files |
| Scoping | Bare text = everything; `>` commands, `@` graph, `#` concepts. Prefixes cost no screen space, unlike a filter row |
| Matching | Subsequence: `vs` → Vestibular Schwannoma, `tymp` → tympanostomy. Exact prefix wins, then substring, then subsequence |
| Ordering | Match quality, then most-recently-touched. **Never by due count** |
| Empty state | Where you left off. Not a queue, not a badge |
| Commands | Theme, font, reviewer code, export, miss log, start a session — things doable without leaving the page |
| Mobile | Same layer, opened by the button, full-screen sheet. No shortcut, so the button carries it |
| State | Recent list in `localStorage` under the existing `sk_*` namespace, capped, fail-safe (add to the `docs/decisions.md` §3 registry) |
| Cost | One script + one style block + one element per page. **Purely additive** — nothing is removed, so it reverts in one commit |

## 4. Build order

1. **Ship the console alone, over the existing pages.** Additive, reversible,
   independently verifiable. Live with it for a week.
2. **Index from what already loads** — no new data files.
3. **Then de-emphasise due everywhere else**: badges become one quiet line, the
   hub reorganises around browse + recency + misses, the streak leaves the
   backlog.
4. **Then, optionally, the palette** — still a two-block edit in
   `css/tokens.css`, independent of all the above.

Do **not** combine the console with the hub reorganisation in one change. The
console is revertible in a single commit; a hub rewrite is not.

## 5. Answered (owner, 2026-07-27)

1. **Beside navigation, not replacing it — and accessibility is a requirement.**
   So the console is an enhancement over working pages, never the only route.
   Concretely: a visible topbar button (not just a shortcut), a real focus trap
   while open, focus returned to the trigger on close, `role="dialog"` +
   `role="listbox"`/`option` with `aria-activedescendant`, results announced via
   a polite live region, full operability without a pointer *and* without a
   keyboard shortcut, hit targets ≥44px on touch, and `prefers-reduced-motion`
   respected. Every page must remain fully usable with the console's script
   removed — that is the test.
2. **Index question stems: yes, if it improves function.** It does — "that
   question about Scarpa's" becomes findable. Sequence it *after* caching
   (backlog #4) so it doesn't cost a module load on every page; until then,
   index stems lazily on first console open and keep the result in memory.
3. **Commands act, not just navigate.** Theme, font, reviewer code, export,
   miss log, start a session. Anything destructive (reset progress) requires an
   explicit confirm step inside the palette.
4. **Due stays out of sight** — one quiet line inside the session control, and
   nowhere else. No badges, no counters, no streak.
5. **Graph is NOT the home page** — and the graph itself has a real problem;
   see §6.
6. **Verification** (unchanged, still required): opens on ⌘K and on the button,
   filters, arrow-navigates, Enter routes, Esc closes *and returns focus*, and
   the page still works with the script absent.

## 6. The graph — diagnosed, not defended

Owner, 2026-07-27: *"it's very junky and on top of that super fragmented (wsup
w the 3 graphs lol)"*. Both halves check out against the real data.

Evidence (from `data/kag-graph.json`, laid out with a force algorithm of the
same family the site uses):
<https://claude.ai/code/artifact/739db5a8-34cb-475c-a6c0-d4324a766504>

| Measure | Value | Why it matters |
|---|---|---|
| Nodes / edges | 771 / 1,221 | Ratio 1.58 — **sparse** |
| Median degree | 2 (p90 = 6, max = 46) | Extremely skewed: long spindly chains plus a few hubs |
| Nodes overlapping a neighbour | **32%** | "Junky", quantified — no label can fit |
| `review:true` | 40 of 771 | 95% DRAFT — exploring it is unrewarding because it isn't trustworthy |

**On "3 graphs":** technically there is one page and one engine — the three
surfaces were consolidated into `graph.html` behind a lens switcher, removing
~2,800 lines. But that fixed the **code**, not the **concept**. You still
arrive and are asked which of three things you meant. The fragmentation is
real and was never addressed. Worse, only one of the three is a genuine lens:

- **Knowledge** — all 771 nodes. This is the hairball.
- **Structural** — the 288 physical structures. That is a *filter*, not a mode.
- **Study** — subspecialty → module → domain → concept, drawn from the
  manifest, not from the KAG at all. Redundant with the hub, and now with the
  console.

### Recommendation — A + B + C together

- **A. Never render the whole graph.** It stops being a destination and becomes
  a panel answering "what connects to this?", reached from the console, a
  concept chip, or a question.
- **B. One view, one filter.** Keep "connections"; make structural a filter
  chip; retire the study lens outright.
- **C. Radial ego layout instead of force-directed.** At median degree 2 a
  force simulation is the wrong tool. Focus at centre, neighbours on rings,
  each second-hop node inside the wedge of whatever introduced it —
  deterministic, instant, never overlaps, and it needs no layout extension.
  (Implemented in the artifact's middle panel, not just described.)
- **D, alongside:** default to `review:true`, DRAFT behind a toggle.

**Not recommended:** rebuilding the renderer. Cytoscape is not the problem —
the defaults are. And retiring the graph entirely throws away the one thing the
site has that no question bank does.

**The real fix is content, not layout.** No arrangement makes 95%-unvetted
material feel authoritative; the DRAFT review queue (`docs/feature-requests.md`
#5) is what turns the graph from a curiosity into a reference.
