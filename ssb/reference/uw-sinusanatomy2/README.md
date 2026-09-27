# UW "Interactive CT Sinus Anatomy" — reference crawl

Source: **Interactive CT Sinus Anatomy**, University of Washington Department of
Radiology, Seattle — http://uwmsk.org/sinusanatomy2/

Authors (from the site's home page): Sung E. LoGerfo, M.D.; Michael L.
Richardson, M.D.; Robert W. Dalley, M.D.; Yoshimi Anzai, M.D. Image EXIF data
(Adobe Photoshop CS4, Macintosh) is dated November 2009, consistent with a
~2009–2010 build.

**Permission**: owner-reported (the SSB project owner, an ENT resident) as
having the authors' permission to use this site's content, reported
2026-09-27, scope unspecified. This has not been independently verified by
this crawl; treat the scope of that permission as unconfirmed until the owner
clarifies what may be reproduced (labels/text vs. images) and where.

This crawl is a **text-only reference**: no image or page copy is committed
to this repository (see `docs/ssb.md` / repo policy — content here is IDs,
labels, and citations only, never pixels).

## Site map

All pages live under `/sinusanatomy2/`. Nav is a fixed top bar repeated on
every static page: Home · Frontal · Maxillary · Ethmoid · Sphenoid ·
Interactive Atlas · Quiz (Maxillary/Frontal/Ethmoid/Sphenoid each expand to
their own Normal/Abnormal pair once you're on that section).

| Page | Content | Images |
|---|---|---|
| `index.html` | Home/about, author credits | 1 (hero) |
| `quickstart/QuickStart.html` | Unlabeled scroll-over-skull demo (coronal plane only) | 109 unlabeled slices, shares the coronal stack |
| `axial/axial.html` | Interactive axial atlas: hover a lateral skull graphic to scroll, click for labels | 175 unlabeled + 175 labeled slices |
| `coronal/coronal.html` | Interactive coronal atlas, same mechanism | 109 unlabeled + 109 labeled slices |
| `sagittal/sagittal.html` | Interactive sagittal atlas, same mechanism | 137 unlabeled + 137 labeled slices |
| `Frontal-Normal.html` | Frontal sinus/FSDP normal anatomy & variants, static labeled images + captions | 11 |
| `Frontal-Abnormal.html` | Frontal sinus inflammatory disease & sequelae | 14 |
| `Maxillary-Normal.html` | Maxillary sinus normal anatomy & variants | 9 |
| `Maxillary-Abnormal.html` | Maxillary sinus inflammatory disease & sequelae | 16 |
| `Ethmoid-Normal.html` | Ethmoid sinus normal anatomy & variants | 11 |
| `Ethmoid-Abnormal.html` | Ethmoid sinus inflammatory disease & sequelae | 11 |
| `Sphenoid-Normal.html` | Sphenoid sinus normal anatomy & variants | 8 |
| `Sphenoid-Abnormal.html` | Sphenoid sinus inflammatory disease & sequelae | 7 |
| `quiz.html` | Text-only Q&A (click-to-reveal answers), no images | 0 |

13 pages total; all returned HTTP 200. No pages beyond this set were found —
every internal link was followed and the four `*-Abnormal.html` pages (one
per sinus) account for the "likely other" pages anticipated going in.

## How images and labels are implemented

Both mechanisms are pre-HTML5, jQuery-free, hand-rolled JavaScript from the
mid/late-2000s:

- **Interactive atlas** (`axial/`, `coronal/`, `sagittal/`): an `<img usemap>`
  over a small reference skull/skull-in-profile graphic, with an `<area>`
  per pixel-row mapped to `onmouseover`/`onmouseout` handlers that swap
  `document.images.x_section.src` between preloaded `Image()` objects
  (`imgNNN.jpg` unlabeled, `imgNNNlab.jpg` labeled). Clicking swaps to the
  `...lab.jpg` variant. **Labels are baked into the JPEG pixels** as
  Photoshop-drawn white text + arrows — there is no separate JS label/overlay
  array, image map of hotspots-with-text, or SVG. This means every label had
  to be read visually; it also means each `...lab.jpg` is a stable, directly
  linkable static image (`.../axial/img050lab.jpg` etc.), so no browser
  automation was needed — plain `curl` sufficed once the naming scheme was
  known.
- **Static Normal/Abnormal pages**: ordinary `<img>` + caption `<p>`. Labels
  are again baked into the JPEG as short white abbreviations (`MS`, `NLD`,
  `IT`, `MO`, `EB`, …) plus arrows/arrowheads/asterisks; the caption text
  underneath spells out each abbreviation, so these pages are self-documenting
  without needing OCR.
- **Quiz**: plain HTML, `<a class="effect">` click-to-reveal `<span>` answers,
  no images.

## Quality assessment

Based on a representative sample of ~40 interactive-atlas images (roughly
every 8th–10th slice across all three planes, from vertex/nasion to skull
base/upper neck) plus several static Normal/Abnormal images, viewed directly:

- **Resolution/reformat quality**: labeled images are modest by current
  standards (JPEG, ~430–630 px on a side, `72 dpi` metadata, EXIF resolution
  98×106 — a screen/PACS capture rather than a native DICOM export). Bone
  detail is nonetheless sharp enough to resolve small foramina (optic canal,
  foramen rotundum, vidian canal, sphenopalatine foramen) cleanly, consistent
  with thin-section bone-algorithm CT reformats. No obvious motion or
  reformat artifact was seen in the sample.
- **Windowing**: bone window throughout the labeled anatomy sets; the
  Abnormal-page captions explicitly flag the (few) post-contrast soft-tissue
  window images (e.g. cavernous sinus thrombosis cases). Windowing looked
  appropriate for what each image was teaching in every sampled case.
  Every labeled interactive-atlas frame is cropped to a black circular
  field of view — a capture artifact of the original viewer, not a scan
  parameter.
- **Label placement**: of the labels spot-checked (~40+ across the sample,
  well over the ~10 requested), every arrow/label pointed at the anatomically
  correct structure for its slice level, judged against standard
  cross-sectional sinus/skull-base anatomy. No mislabeled structure was
  found. Two typos were found in the baked-in text itself (not mislabeling,
  just spelling): **"sphenooccipital sychondrosis"** (missing an *n*; should
  be *synchondrosis*, axial slice 130) and an inconsistently spelled
  **"retroanrtal fat pad"** (transposed letters, axial slice 120; the same
  structure is spelled correctly "retroantral fat pad" on slices 130/140).
  One abbreviation collision was found across pages: `FS` denotes "frontal
  sinus" throughout every Normal/Abnormal page **except** one caption on
  `Sphenoid-Normal.html`, where `FS` is reused for "foramen spinosum" in the
  same parenthetical as `FO` (foramen ovale) — a page-local ambiguity, not a
  labeling error.
- **Terminology era**: EXIF puts the build at ~2009. Consistent with that,
  the site uses **pre-IFAC** frontal-recess/frontal-cell language throughout:
  "frontal recess" / "frontal sinus drainage pathway (FSDP)" and "agger nasi
  (cell)" appear repeatedly, but the **Kuhn cell classification is never
  used** anywhere on the site (no "Kuhn type 1–4", "supraorbital ethmoid
  cell", etc.) — frontal cells simply aren't sub-typed at all, rather than
  being typed with an outdated scheme. There is no reference to the 2016
  International Frontal Sinus Anatomy Classification (IFAC) or the 2014 EPOS
  terminology paper (unsurprising, both postdate the site by years). Older
  eponyms in active use — **Haller cell** (infraorbital ethmoid cell) and
  **Onodi cell** (sphenoethmoidal cell) — remain acceptable alternative names
  in current nomenclature (EPOS keeps both as synonyms), so nothing here is
  actually wrong, just simpler/older-style than a current classification-first
  teaching module would be.

## Image/label inventory

See `labels.json` for the full vocabulary (148 distinct terms) and
`crosswalk.json` for the match against `ssb/content/*.json`. See `gaps.md`
for terms the graph doesn't yet cover and synonyms worth adding.

Interactive-atlas coverage in this crawl is a **representative sample**, not
exhaustive: every 8th–10th slice was viewed (axial 1–175, coronal 1–109,
sagittal 1–137; ~40 of ~421 labeled frames), which is sufficient to build a
reliable vocabulary since the same handful of structures recur across runs
of consecutive slices, but a handful of single-slice-only labels elsewhere
in the stacks may not be captured. The eight static Normal/Abnormal pages'
captions were read in full (not sampled), so their vocabulary is complete.
