# Security — model and rules

A static personal site with no accounts, no server and no secrets. What there is
to protect: visitors (script injection on this origin), the owner's reputation
(defacement, a hijacked dependency), and the browser-local OKSAT progress.
`tools/check-data.mjs` enforces the page rules below in CI.

## Rules for every page

1. **CSP meta, `script-src 'self'`.** Each page carries a
   `<meta http-equiv="Content-Security-Policy">` with `script-src 'self'`,
   `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`. No
   `'unsafe-inline'` or `'unsafe-eval'` for scripts; no remote script origins.
   `style-src` keeps `'unsafe-inline'` (the engine and several pages set inline
   styles; style injection is low-impact).
2. **No inline script, no `on*=` handlers, no `javascript:` URLs.** Page logic
   lives in `js/*.js`; the pre-paint theme is `js/theme-boot.js`. JSON-LD data blocks are fine.
3. **Same-origin scripts only.** Third-party code is vendored byte-for-byte into
   `js/vendor/` with its SHA-384 pinned (`js/vendor/README.md`). That includes
   three.js (0.186.1, for `ssb.html`), vendored with one patched import line per addon
   and no import map (an import map would be an inline script). `type="module"`
   scripts from same-origin files satisfy `script-src 'self'`; `tools/stamp-assets.mjs`
   rejects bare or non-same-origin import specifiers in `js/ssb/`. Vendored three.js
   contains no `eval`, `new Function`, workers or WebAssembly. SSB model packs stay
   free of embedded textures (`img-src 'self'` blocks `blob:` images).
4. **`innerHTML` only with escaped data.** Anything that reaches markup goes through
   an `esc()`; anything from the URL (`location.search`, `location.hash`) goes through
   `textContent` or is matched against a known list first. The figure engine
   (`js/ascii3d.js`) builds its grid with `textContent`; its baked frames are escaped by `tools/ascii3d.mjs`.
5. **`target="_blank"` carries `rel="noopener"`** (plus `noreferrer` on the one-pager).
6. **Self-contained pages make no remote request at all:** `index.html`,
   `cpt-search.html`, `airway-jeopardy.html`, `ssb.html`, `OLSB.html`. Their CSPs name
   no remote origin. Exceptions, all same-origin or user-initiated:
   - `OLSB.html`'s Real CT mode fetches `tbone/` only once the mode is entered; its CSP is unchanged. Its Web Worker is a stamped same-origin file, allowed by `script-src 'self'`.
   - `ssb.html` reads its content with same-origin `fetch`, covered by `default-src 'self'`. Its citation links to DOI and PubMed are plain navigations built in `js/ssb/ui-panel.js` from validated ids, with `rel="noopener"`, and request nothing until clicked.
   - The URL hash is untrusted. `js/ssb/state.js` matches it against the graph index; it never reaches markup.
   - OKSAT pages may fetch optional Google Fonts, only when a non-default typeface is picked.

Changing any of these (a new CDN, loosening a CSP) is an owner decision (`docs/decisions.md` §7).

## Limits of a static host

GitHub Pages cannot send response headers, so there is no `frame-ancestors`
(clickjacking protection needs a header; a `<meta>` CSP ignores it), no HSTS, and no
`Permissions-Policy`. With no login and no state-changing actions, framing has little
to hijack. A host with header control (for example Cloudflare in front) would close this.

Everything committed is public: the whole repository is served, including `docs/`,
`tools/` and `archive/`. Nothing secret may be committed, ever (`AGENTS.md`).

## Residual risk

- Optional Google Fonts on OKSAT pages (the one remote request an OKSAT page can make).
- Header-only protections above (`frame-ancestors`, HSTS, `Permissions-Policy`).

Checked clean: no API keys or private keys in git history; image EXIF and XMP carry no
GPS or device data; CPT and Airway escape all data before `innerHTML`; no `eval` or
`new Function` in shipped code. Re-check these when adding a page or a vendored file.
