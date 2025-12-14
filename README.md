# Samipya Kafle, MD - Personal Website

Personal portfolio website for Dr. Samipya Kafle, otolaryngology resident in the Pacific Northwest.

## Live Site

[skflx.github.io](https://skflx.github.io)

## Features

### Dynamic Color System
- **Color extraction from hero image**: Automatically extracts dominant colors from the profile photo
- **Matte color palette**: Extracted colors are converted to matte versions for a professional look
- **CSS custom properties**: Dynamic colors are applied site-wide through CSS variables

### Dark Mode
- Toggle button in header (sun/moon icons)
- Respects system preference (`prefers-color-scheme`)
- User preference persisted via localStorage

### Pages
- **Home** (`index.html`) - Combined landing page with hero, about, research focus, and interests
- **Projects** (`projects.html`) - Tabbed interface for Research, Technology, Art, Music, and Clinical work
- **Contact** (`contact.html`) - Functional contact form with Formspree integration

### Design
- Tailwind-inspired clean, minimal aesthetic
- Professional color scheme with matte accents
- Responsive design for mobile and desktop
- Modern typography (DM Sans + Inter via Google Fonts)
- Smooth transitions and scroll-triggered animations

## Tech Stack

- **HTML5** - Semantic markup
- **CSS3** - Custom properties, Grid, Flexbox, animations
- **JavaScript** - Vanilla JS (no frameworks)
- **Fonts** - Google Fonts (DM Sans, Inter)
- **Icons** - Font Awesome 6
- **Forms** - Formspree

## File Structure

```
├── index.html          # Home page (combined with About)
├── projects.html       # Projects with tabbed navigation
├── contact.html        # Contact form
├── css/
│   └── main.css        # Main stylesheet with design system
├── js/
│   └── main.js         # Dynamic colors, dark mode, interactions
├── images/
│   ├── me_large.jpg    # Hero profile image
│   ├── art-placeholder.svg
│   └── music-placeholder.svg
├── scripts/
│   └── update_from_cv.py  # Publication list generator (deprecated)
├── README.md           # This file
├── MAINTENANCE.md      # Maintenance guide
└── TODO.md             # UI/UX improvements tracker
```

## Local Development

Simply open any HTML file in a browser. No build step required.

For the contact form to work, you'll need to register the Formspree endpoint or replace with your own.

## Browser Support

Modern browsers (Chrome, Firefox, Safari, Edge). Uses:
- CSS Custom Properties
- CSS Grid/Flexbox
- Backdrop Filter
- Intersection Observer API
- Canvas API (for color extraction)

## License

Personal use only. Content and design are proprietary.
