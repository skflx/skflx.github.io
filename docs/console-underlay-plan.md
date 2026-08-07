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

## 5. Open questions (owner call)

1. **Console beside navigation, or replacing it?** Recommend beside — ⌘K as the
   only route is hostile to a first visit and on a phone.
2. **Index question stems?** Makes "that question about Scarpa's" findable, but
   costs loading every module on every page. Worth it only after caching
   (backlog #4).
3. **Should commands *act*, or only navigate?** Acting is what makes it a
   console rather than a search box — but it needs a confirm step for anything
   destructive.
4. **Keep a due number anywhere?** Suggest one quiet line inside the session
   control, nowhere else.
5. **Graph as the home page?** Fits "explore, don't drill", but it needs
   Cytoscape before anything renders — the slowest possible front door, and it
   breaks with the CDN. Keep it one keystroke away instead.
6. **Verification.** The console needs its own smoke assertions: opens on ⌘K,
   filters, arrow-navigates, Enter routes, Esc closes and returns focus.
   Keyboard behaviour is the feature, so it must be tested like one.
