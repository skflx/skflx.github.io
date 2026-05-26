# Website Redesign Mockups — Comparison Guide

> Open each HTML file in your browser to see the live mockup. All support dark mode toggle.

---

## Current Site Issues (Why Redesign?)

| Problem | Detail |
|---------|--------|
| **Too spread out** | 3 separate pages (index, projects, contact) for relatively little content |
| **Oversized hero** | 85vh hero with large image takes up most of the first viewport |
| **Hidden content** | Projects page uses tabs — users must click to discover content |
| **Redundant elements** | Same header/footer duplicated across all pages |
| **Low information density** | Large spacing and decorative elements push content below the fold |
| **Too many clicks** | Visiting all content requires navigating to 3 pages + clicking 5 tabs |

---

## Mockup A: Condensed Single-Page
**File:** `mockup-a-condensed.html`

### Design Philosophy
Strip everything down to a single scrollable page. Compact hero (circular photo, 50vh). All content visible without tabs. Tight vertical spacing. Minimal decorative elements.

### Key Changes from Current Site
- **Single page** — no navigation between pages
- **50vh compact hero** with circular profile photo instead of 85vh
- **"What I Do" as chips** — compact horizontal pills instead of 6 full cards
- **Research as a list** — clickable rows with arrows instead of large cards
- **Projects as small cards** — 3-column grid, minimal padding
- **Clinical as inline table** — date | content layout, no vertical timeline
- **Contact is a single row** — text + social pill links inline
- **One-line footer** — no multi-column footer grid

### Best For
- Users who value speed and scannability
- Mobile-first audiences
- Minimalists who want everything accessible in one scroll

### Vibe
Clean, functional, developer-portfolio aesthetic. GitHub README energy.

---

## Mockup B: Bento Grid
**File:** `mockup-b-bento.html`

### Design Philosophy
Everything is a "tile" in a masonry-style bento grid. Inspired by Apple product pages and Linear's design language. Highly visual. Cards of varying sizes create visual rhythm. Looks incredible in dark mode.

### Key Changes from Current Site
- **No traditional page sections** — everything is bento cards
- **Full-width hero card** spanning the grid
- **Education, Languages, Interests** as separate small tiles
- **Research as a 2x2 grid inside a wide card** — visual and clickable
- **Tech projects as a stacked list card**
- **Clinical as a compact list card**
- **"Let's Connect" as a gradient accent card** — visually striking CTA
- **Location gets its own micro-card**
- **Entire site is one viewport-ish view** on desktop

### Best For
- Making a strong visual first impression
- Audiences who value modern/trendy design
- Portfolio reviews where aesthetics matter

### Vibe
Apple keynote energy. Modern, visual-first, statement-making.

---

## Mockup C: Editorial / Magazine
**File:** `mockup-c-editorial.html`

### Design Philosophy
Typography-forward. Serif headings (Playfair Display) with sans-serif body (Inter). Two-column newspaper-style layouts. Academic but elegant. Dense content without feeling cluttered. Warm, golden accent color.

### Key Changes from Current Site
- **Serif masthead** — classic editorial feel, centered navigation
- **Photo has grayscale filter** — editorial photography style
- **Two-column body** — about text left, education/languages right (newspaper columns)
- **Research as bordered entries** — left-border accent, hover background
- **Projects as a structured table/list** — year | name | tag format
- **Clinical as a CV-style list** — academic formatting
- **Interests written as prose** with inline tag chips — feels human and readable
- **Warm gold accent** instead of blue — more sophisticated, academic

### Best For
- Academic/professional audiences (attendings, department chairs)
- When content depth matters more than visual flash
- Standing out from the sea of blue-accent tech portfolios

### Vibe
New Yorker profile page. Academic elegance. Refined and intellectual.

---

## Quick Comparison Matrix

| Feature | A (Condensed) | B (Bento) | C (Editorial) |
|---------|:---:|:---:|:---:|
| Pages | 1 | 1 | 1 |
| Hero size | Compact (50vh) | Card-based | Compact + photo |
| Primary font | DM Sans + Inter | DM Sans + Inter | Playfair + Inter |
| Layout style | Linear scroll | Grid tiles | Columnar |
| Information density | High | Medium-High | High |
| Visual impact | Medium | Very High | High (typographic) |
| Dark mode | Yes | Yes (exceptional) | Yes |
| Academic feel | Medium | Low | Very High |
| Mobile behavior | Stacked sections | Stacked cards | Single column |
| Content visibility | All visible | All visible | All visible |
| Accent color | Blue (#4a6cf7) | Apple Blue (#0071e3) | Gold (#b8860b) |

---

## Recommendation

You can mix-and-match elements. For example:
- **Bento grid layout** + **Editorial typography** = bold but intellectual
- **Condensed structure** + **Bento cards** for just the "What I Do" section
- **Editorial research section** in any layout (the left-border entries are excellent)

All three mockups solve the core issues: they're single-page, content-dense, and everything is visible without clicking through tabs.
