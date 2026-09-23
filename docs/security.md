# Security — model, audit, and the rules that keep it

A static personal site with no accounts, no server, and no secrets. What
there is to protect: visitors (script injection on this origin), the
owner's reputation (defacement, a hijacked dependency), the browser-local
OKSAT progress, and — once the wiki exists — what leaves the Obsidian
vault. `tools/check-data.mjs` enforces the page rules below in CI.

## Rules for every page

1. **CSP meta, `script-src 'self'`.** Each page carries a
   `<meta http-equiv="Content-Security-Policy">` with `script-src 'self'`,
   `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`. No
   `'unsafe-inline'`/`'unsafe-eval'` for scripts, no remote script origins.
   `style-src` keeps `'unsafe-inline'` (the engine and several pages set
   inline styles; style injection is low-impact).
2. **No inline script, no `on*=` handlers, no `javascript:` URLs.** Page
   logic lives in `js/*.js`; the pre-paint theme is `js/theme-boot.js`.
   JSON-LD data blocks are fine.
3. **Same-origin scripts only.** Third-party code is vendored byte-for-byte
   into `js/vendor/` with its SHA-384 pinned (`js/vendor/README.md`).
4. **`innerHTML` only with escaped data.** Anything that reaches markup goes
   through an `esc()`; anything from the URL (`location.search`/`hash`)
   goes through `textContent` or is matched against a known list first.
5. **`target="_blank"` carries `rel="noopener"`** (plus `noreferrer` on the
   one-pager).
6. **Self-contained pages make no remote request at all** —
   `index.html`, `cpt-search.html`, `airway-jeopardy.html`. Their CSPs
   name no remote origin. OKSAT pages may fetch optional Google Fonts
   (only when a non-default typeface is picked).

Changing any of these (a new CDN, loosening a CSP) is an owner decision —
`docs/decisions.md` §7.

## Limits of a static host

GitHub Pages cannot send response headers, so there is no
`frame-ancestors` (clickjacking protection needs a header; `<meta>` CSP
ignores it), no HSTS preload control, and no `Permissions-Policy`. With no
login and no state-changing actions, framing has little to hijack. Moving
to a host with header control (e.g. Cloudflare in front) would close this.

Everything committed is public — the whole repository is served, including
`docs/`, `tools/`, `archive/` and `wiki/`. Nothing secret may be committed,
ever (`CLAUDE.md`).

## Audit, 2026-09-23

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | **Reflected DOM XSS** in `oksat-study.html`: `?m=` was concatenated into `root.innerHTML` in the not-found notice. A crafted link ran script on `skflx.github.io` (read/alter OKSAT progress, deface, phish under the site's name). Reproduced before the fix. | High | Fixed: notice built with `textContent` (`js/oksat-viewer.js`); regression test in `tools/smoke-pages.mjs`. |
| 2 | React/ReactDOM/htm loaded from unpkg as `react@18` / `htm@3` — floating versions, no SRI. A compromised or re-published package would run on the study page. | Medium | Fixed: vendored exact versions, hashes pinned in CI. |
| 3 | No CSP on any page; inline scripts everywhere, so any injection would have run unhindered. | Medium | Fixed: CSP on all pages; inline scripts moved to files. |
| 4 | Third-party CSS/fonts on the one-pager and CPT (Font Awesome from cdnjs, Google Fonts): an extra origin and an IP leak to Google on every visit. | Low | Fixed: Font Awesome removed; faces self-hosted in `fonts/`. |
| 5 | CI workflow ran with the default token scope. | Low | Fixed: `permissions: contents: read`. |
| 6 | `jsdom` declared as a runtime dependency, used nowhere; it pulled in `ws` with a known high-severity advisory. Dev-only, never shipped. | Low | Fixed: removed; `npm audit` clean. |
| 7 | Hub cards built with `innerHTML` from manifest strings without escaping (committed data, so not exploitable today). | Info | Hardened: escaped, and hue values validated as hex. |
| 8 | CPT search history is kept in `localStorage` (`cpt-history`, `cpt-analytics`) and was missing from the key registry. | Info | Registered (`docs/decisions.md` §3). Local to the browser. |
| — | Checked, clean: git history has no API keys or private keys; image EXIF/XMP carries no GPS or device data; CPT and Airway escape all data before `innerHTML`; no `eval`/`new Function` in shipped code. | — | — |

Residual: optional Google Fonts on OKSAT pages; header-only protections
(above); and the wiki, below.

## The wiki boundary

`wiki/sync/sync-vault.mjs` is the only path from the vault to anything
public. It is fail-closed by design — folder allowlist, Personal Notes
stripped, PHI/credential tripwire, gate on `status` — and is tested on a
synthetic vault by `tools/test-wiki-sync.mjs`. Changing
`wiki/sync/policy.json` changes what can be published: owner decision.
See `wiki/README.md` for the open questions (public vs. gated, unvetted
content).
