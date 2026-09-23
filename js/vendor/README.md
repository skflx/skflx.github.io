# js/vendor — third-party scripts, self-hosted

Byte-for-byte copies of the UMD builds from the npm tarballs below. They were
loaded from unpkg before; serving them same-origin removes a third-party
script origin (supply-chain and availability risk), lets every page run
`script-src 'self'`, and makes the test suite hermetic.

| File | Package | License |
|---|---|---|
| `react-18.3.1.production.min.js` | `react@18.3.1` → `umd/react.production.min.js` | MIT (`LICENSE-react.txt`) |
| `react-dom-18.3.1.production.min.js` | `react-dom@18.3.1` → `umd/react-dom.production.min.js` | MIT (same authors, same text) |
| `htm-3.1.1.umd.js` | `htm@3.1.1` → `dist/htm.umd.js` | Apache-2.0 (`LICENSE-htm.txt`) |

`tools/check-data.mjs` pins the SHA-384 of each file, so an accidental edit
fails CI. To upgrade: `npm pack <pkg>@<version>`, copy the same path out of
the tarball, rename with the new version, update `oksat-study.html` and the
hashes in `tools/check-data.mjs`.
