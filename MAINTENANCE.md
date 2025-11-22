# Website Maintenance Guide

This website is a static HTML/CSS/JS site.

## Automatic Updates
Some features are automated via scripts.

### Updating Publications
To update the list of publications on `projects.html` from PubMed:

1. Ensure you have Python 3 installed.
2. Run the update script:
   ```bash
   python3 scripts/update_from_cv.py
   ```
3. Follow the prompts (type 'y' to query PubMed).
4. The script will fetch the latest articles for "Kafle Samipya" and update the section between `<!-- PUBS_AUTO_START -->` and `<!-- PUBS_AUTO_END -->` in `projects.html`.

### Residency Status
The PGY level (e.g., "PGY-2") is calculated automatically in `js/main.js`.
- **Start Date:** July 1, 2024.
- **Logic:** Updates automatically every July.
- If you need to change the start date, edit the `startDate` variable in `js/main.js`.

## Theming
The website supports 3 color themes and 3 typography styles.
- Definitions are in `css/main.css` under `:root` and `body.theme-xxx`.
- Preferences are saved in the user's `localStorage`.

## CV Updates
For other CV updates (Bio, Awards, etc.), edit the HTML files (`index.html`, `about.html`) directly.
