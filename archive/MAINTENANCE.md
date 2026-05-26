# Website Maintenance Guide

This website is a static HTML/CSS/JS site with dynamic theming.

## Site Structure

| Page | File | Description |
|------|------|-------------|
| Home | `index.html` | Landing page with hero, about, research focus, interests |
| Projects | `projects.html` | Tabbed interface (Research, Tech, Art, Music, Clinical) |
| Contact | `contact.html` | Contact form with Formspree |

**Note:** The About page was merged into the Home page. There is no separate `about.html`.

---

## Dynamic Features

### Color Extraction from Hero Image

The site automatically extracts colors from the hero image (`images/me_large.jpg`) and creates a matte color palette.

**How it works:**
1. On page load, `js/main.js` draws the hero image to a canvas
2. Extracts dominant colors using color quantization
3. Converts colors to matte versions (reduced saturation)
4. Applies colors to CSS custom properties

**To change the color scheme:** Simply replace `images/me_large.jpg` with a new photo. The colors will automatically update.

**Fallback colors:** If color extraction fails (CORS, etc.), fallback colors are defined in `css/main.css`:
```css
--color-primary: #4a5568;
--color-accent: #667eea;
--color-secondary: #718096;
```

### Dark Mode

**Toggle:** Sun/moon button in the header

**Behavior:**
- Respects system preference (`prefers-color-scheme`) on first visit
- User preference saved to `localStorage` as `sk_theme`
- Values: `light` or `dark`

**CSS:** Dark mode styles are defined in `css/main.css` under `[data-theme="dark"]`

### Residency Status

The PGY level (e.g., "PGY-2") is calculated automatically in `js/main.js`.

- **Start Date:** July 1, 2024
- **Logic:** Updates automatically every July
- **Element:** `#pgy-status` in `index.html`

To change the start date, edit the `startDate` variable in `updateResidencyStatus()`.

---

## Contact Form

The contact form uses [Formspree](https://formspree.io) for submissions.

**Current endpoint:** `https://formspree.io/f/xpwzgkjd`

**To set up:**
1. Create a Formspree account
2. Create a new form and get your form ID
3. Replace the form action URL in `contact.html`

**Form fields:**
- `name` - Sender's name
- `email` - Sender's email (replies go here)
- `subject` - Message subject
- `message` - Message body

---

## Updating Content

### Hero Section
Edit `index.html`, look for the `.hero` section.

### About Section
Edit `index.html`, look for the `#about` section.

### What I Do Section
Edit `index.html`, look for the "What I Do" section with `.grid-3` cards. This unified section combines project categories (Research, Technology, Art, Music) with personal interests (Outdoors, Fitness).

### Projects
Edit `projects.html`. Each tab has its own `<div id="tab-name">` section.

### Publications
The script `scripts/update_from_cv.py` is deprecated. Update publication links in `projects.html` manually by editing the PubMed query URLs.

---

## Styling

### Design System

The design uses CSS custom properties defined in `css/main.css`:

```css
/* Spacing */
--spacing-xs: 0.5rem;
--spacing-sm: 1rem;
--spacing-md: 1.5rem;
--spacing-lg: 2rem;
--spacing-xl: 3rem;
--spacing-2xl: 4rem;

/* Colors (dynamic + fallback) */
--color-primary, --color-secondary, --color-accent
--bg-primary, --bg-secondary, --bg-tertiary
--text-primary, --text-secondary, --text-muted

/* Shadows */
--shadow-sm, --shadow-md, --shadow-lg, --shadow-xl
```

### Typography

Fonts loaded from Google Fonts:
- **DM Sans** - Headings (`--font-display`)
- **Inter** - Body text (`--font-sans`)

### Responsive Breakpoints
- Mobile: `max-width: 768px`
- Tablet: `max-width: 968px`

---

## Adding Images

### Art Gallery
1. Add images to `images/` folder
2. In `projects.html`, add to the Art tab:
```html
<div class="art-item reveal">
    <img src="images/your-artwork.jpg" alt="Description" loading="lazy">
</div>
```

### Music Section
1. Add images to `images/` folder
2. In `projects.html`, add a music card:
```html
<div class="music-card reveal">
    <img src="images/your-image.jpg" alt="Description" loading="lazy">
    <div class="music-card-content">
        <h3>Title</h3>
        <span class="date">Date</span>
        <p>Description</p>
    </div>
</div>
```

---

## Social Links

Social links appear in:
- Footer (all pages)
- Contact page sidebar

Current social profiles:
- LinkedIn (`linkedin.com/in/skflx`)
- Instagram (`instagram.com/skflx`)
- GitHub (`github.com/skflx`)

**Note:** Twitter was intentionally removed.

---

## CV/Resume

A CV download link is available on the Projects page. Place your CV file at `documents/cv.pdf`.

---

## Animations

Scroll-triggered animations use the Intersection Observer API. Elements with class `.reveal` will fade in when scrolled into view.

To disable animations, users can enable "reduce motion" in their OS settings. The site respects `prefers-reduced-motion`.

---

## Performance Notes

- Hero image loads eagerly (`loading="eager"`)
- Other images use lazy loading (`loading="lazy"`)
- Fonts use `font-display: swap` via Google Fonts
- CSS and JS are not minified (static site, no build step)
