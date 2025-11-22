# Website Maintenance Guide

This website is a static HTML/CSS/JS site.

## Automatic Updates
Some features are automated via scripts.

### Updating Publications
**Note:** The previous automated list generator (`scripts/update_from_cv.py`) is deprecated in favor of curated "Research Focus" cards in `projects.html`.
However, you can still run it to get a raw list of new publications if needed, but you must manually update the cards to reflect new research areas.

To check for new publications:
1. Run `python3 scripts/update_from_cv.py`.
2. Review the output (it will try to update `projects.html` but might fail if markers are missing, which is expected now).
3. Use the info to update the *Categories* or links in `projects.html` manually.

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
