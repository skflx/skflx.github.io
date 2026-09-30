# js/vendor — third-party scripts, self-hosted

Byte-for-byte copies of the builds from the npm tarballs below (three.js: one
patched line per addon, recorded further down). React and htm were loaded
from unpkg before; serving them same-origin removes a third-party script
origin (supply-chain and availability risk), lets every page run
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

## three.js (SSB)

`three-0.186.1/` is the `three@0.186.1` npm tarball (MIT, `LICENSE` beside the
files; owner-approved 2026-09-30). The tarball's integrity
(`sha512-blFeqb49wRCSGUGj7gtpfnSGHy2lwDk94RhUmS1c/hTby70kvChbWpkJ4Pm1390LqzzvTmzgXKHPEafJwCb8jA==`)
matches the registry's `dist.integrity`. Only the files SSB uses, plus every
module they import transitively:

| File (under `three-0.186.1/`) | Origin |
|---|---|
| `build/three.module.js`, `build/three.core.js` | byte-identical to the tarball |
| `examples/jsm/controls/OrbitControls.js` | tarball, one line patched |
| `examples/jsm/loaders/GLTFLoader.js` | tarball, one line patched |
| `examples/jsm/utils/BufferGeometryUtils.js`, `examples/jsm/utils/SkeletonUtils.js` | tarball, one line patched (both are imported by `GLTFLoader.js`) |

**The one patch.** Every addon imports the bare specifier `'three'`, which
only resolves through an import map, and an import map is an inline script
(forbidden by the CSP). In each of the four addons the single line
`} from 'three';` is rewritten to `} from '../../../build/three.module.js';`
and nothing else changes. To redo it after an upgrade:

```bash
sed -i "s#^} from 'three';\$#} from '../../../build/three.module.js';#" \
  examples/jsm/controls/OrbitControls.js examples/jsm/loaders/GLTFLoader.js \
  examples/jsm/utils/BufferGeometryUtils.js examples/jsm/utils/SkeletonUtils.js
```

- **Cache key = the directory name.** `js/ssb/scene.js` imports these files
  with no `?v=`, and `tools/stamp-assets.mjs` leaves imports into
  `js/vendor/three-*/` alone: one URL per file keeps one module instance, and
  the version in the path is what busts caches. A version bump is a new
  directory plus new import paths in `js/ssb/`.
- **`.gitignore` exception.** The repo ignores `build/`; `!js/vendor/three-*/build/`
  un-ignores this one (it is shipped, not generated). Check `git status` after
  a copy: an ignored `build/` deploys a site whose 3D stage silently 404s.
- Added dependencies later (a loader, another addon): copy it in, follow its
  imports, apply the same patch, pin its hash. Draco's JS decoder or meshopt
  are decisions in `docs/ssb.md` section 13, not routine additions.
