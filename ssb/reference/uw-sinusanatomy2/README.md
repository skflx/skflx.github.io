# UW "Interactive CT Sinus Anatomy" — reference crawl

Source: **Interactive CT Sinus Anatomy**, University of Washington Department of
Radiology, Seattle — http://uwmsk.org/sinusanatomy2/

Credit is to the atlas and its institution; this repo does not name its
individual authors (owner, 2026-10-07). Image EXIF data (Adobe Photoshop CS4,
Macintosh) is dated November 2009, consistent with a ~2009–2010 build.

**Permission**: written, from the atlas's authors to the owner by email,
2026-10-07: the public CT images may be used in the owner's public,
non-commercial 3D educational model, crediting the atlas. Terms and scope:
`ssb/LICENSE-data.md`. The owner reads it as covering serving the atlas's
own images from this site, credited (`docs/realistic-anatomy.md` §13, RA-O1).

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

## Per-slice extraction (every labeled frame)

`slices.json` supersedes the sampled vocabulary above for positional work:
every one of the 421 labeled atlas frames, each label's text and the pixel
position of every arrow tip. `relations.json` turns those into spatial
relations and tests the graph's spatial claims against them. Regenerate
with `tools/ssb-pipeline/uw/` (see `tools/ssb-pipeline/README.md`); the
images themselves are fetched into a gitignored folder and never committed.

**Method.** The site publishes each slice twice, unlabeled and labeled.
Annotations are pure white while this CT tops out near 220, so a threshold on
the labeled frame (minus any bright bone in the unlabeled twin) isolates text
and arrows exactly. Text is read by local OCR (RapidOCR); OCR variants that
fuzzy matching missed were decoded by eye from label crops and are listed as
aliases in `relate.py`. Each arrow is skeletonized; its tail is the end that
starts at a label and its tip is the other end. Label and tip positions were
spot-checked visually.

**Relations.** Only comparisons within one slice are used, because pixel
spacing and the offsets between planes are unknown: medial/lateral (distance
from a midline taken from labeled midline structures) in axial and coronal,
superior/inferior in coronal and sagittal, anterior/posterior in axial and
sagittal (sagittal faces left). Medial/lateral is compared only between points
at about the same height (coronal) or depth (axial), with a larger margin when
the two points lie on opposite sides. A relation needs agreement on at least
80% of votes from at least three slices.

**Limits — read before trusting a verdict.** An arrow tip is one point
chosen by the labeler inside an extended structure. Where the labeling
convention picks a point that is not representative, even a strong consensus
is wrong about the structure: UW marks the inferior meatus at its lateral part,
beside the turbinate's attachment, so points say "meatus superior to
turbinate" on 23 of 27 votes although the meatus lies beneath and lateral to
the turbinate. A contradiction is therefore a prompt for review, never an
automatic edit. The atlas shows **two** adult heads (see "Two specimens" below) and labels normal anatomy only.

**Results, 2026-09-27.** 2,019 labels (22 unreadable), 97 distinct terms,
794 consensus relations. Of the graph's spatial claims, 39 were testable: 37
agree and 2 contradict — the meatus artifact above, from both directions.
The rest name structures UW does not label on a shared slice.

## Two specimens (reconstruction gate, 2026-09-30)

Registration (`tools/ssb-pipeline/uw/register.py`, results in
`registration.json`) shows the **axial and sagittal stacks are one CT**: the
sagittal images are a rigid reformat of the axial volume (normalized
cross-correlation 0.997; bony edges within 0.2 px at the 90th percentile).
The **coronal stack is a different head** (best correlation 0.39, and
visibly different ethmoid partitions, maxillary septa and sphenoid
septation). Consequences:

- The reference specimen for SSB geometry is the axial/sagittal head only;
  coronal views are resliced from its volume.
- Scale: 0.3437 mm/px in-plane, 0.625 mm axial slices — consistent with a
  180 mm reconstruction circle and 1.000 mm sagittal steps, and with the
  globe's axial length (24.6 mm).
- Coronal labels stay valid as within-slice relational evidence (from a
  second head) but are not mapped into the 3D frame.
- Left–right is assumed radiological (patient right on image left); no label
  names a side.

## Figure inventory (`figures.json`, WP FG1)

Every image on the eight Normal/Abnormal pages as data: page(s) and caption(s) (a file shown on two pages keeps
each page's caption), plane, window, contrast, the caption's own abbreviation map, the labels read from the
image, arrows (tail → tip, px), point marks (arrowheads, asterisks), graph ids, role N/V/P, and a candidate
same-patient group. Numbers and text only; `tools/check-data.mjs` fails on a schema error, an id that is not in
the graph, a coordinate outside its image, or an image file in this folder. Regenerate with
`tools/ssb-pipeline/uw/figures.py build` (`tools/ssb-pipeline/README.md`). Counts are in `meta.summary`.

**What is transcribed and what is measured.** Ids, roles and groups come from `docs/realistic-anatomy.md` §4.1
and are never inferred; an id the graph lacks or the table marks uncertain sits in `idCandidates` /
`proposedNew` with its reason and `ids` stays `null`. Plane (caption first, file name as the cross-check),
window, contrast, labels, arrows and marks are measured from the page and the pixels. Image coordinates are
those of the file the page serves, origin top-left; no label names a side, so left-right is not asserted.

**Annotation mask.** "Pixels ≥ 250 in thin components" does not isolate the annotation on these files: they
are resampled JPEGs, so a stroke's core sits at 240–255 and its anti-aliased edge at 160–230 (a threshold at 250
fragments arrows and glyphs), and bone cortex clips at 255 too. The mask is: seeds ≥ 240 outside thick bright
regions, grown to ≥ 200 within 3 px of a seed. Arrows are then told from cortex ribbons by shape, not by value
(a straight shaft whose widest point, the head, is at one end and is at least 2.5× the shaft width, with the
apex within a head's length of it); a standalone arrowhead is a compact convex blob not lying inside bright
bone; an asterisk is read by OCR, or taken from a speck only where the caption names an asterisk. Parameters:
`meta.method`.

**Soft-tissue and post-contrast figures** clip bone and contrast at the annotation value (a large share of the
image at 255), so the mask cannot be trusted there: they are recorded in full with `arrows`, `labels` and
`marks` `null` and the reason in `meta.notSeparableReason` (FG1 ruling, `docs/realistic-anatomy.md` §10).
`windowEvidence` says what decided each window: the caption ("soft tissue window", "post-contrast"), §4.1's
soft marker, or the histogram (`saturatedPct`, the area of thick saturated regions). `Cor.Inflamm2` is
saturated by the facial bone but a bone window on sight; §4.1 does not mark `Cor.frontalmucocele` and
`Mucocele3` as soft, but their histograms and appearance do. Compare `windowEvidence` before relying on a window.

**Per-figure check (`maskCheck`).** `captionCueMissing` lists what the caption names (arrow, arrowhead, asterisk)
that no detection matches; `nonAnnotation` counts the components rejected, by reason; `unreadShortLabels` counts
labels OCR did not resolve to a caption abbreviation or a graph term. `status: "review"` means one of the first
or last is non-zero, and the figure's tips need a person. An arrow's `suspect` flag marks one with bright bone
close around it (it may be a cortex line, or a real arrow that touches bone). Known failure classes: a cortex
line taken for an arrow (a straight, tapered edge), a thick or bone-adjacent arrow missed, and OCR confusions
(`S`↔`3`) snapped through the caption's own map (`labels[].read` says how). A figure can also show no arrows its
caption describes (`Axial.ethmoid2`).

**Labels.** `labels[].text` is the snapped abbreviation or term; `raw` is what OCR read. `ids` come only from the
caption's own expansion of the abbreviation, or the full word, matched exactly against the crosswalk's terms;
otherwise `null` with the reason. Abbreviations that mean different things across captions are in
`meta.abbreviationConflicts` (e.g. `FS`: frontal sinus, and foramen spinosum on one sphenoid page).

**Same-patient groups** are candidates from §4.1's ⧉ marks (`basis`), all `confirmed: null`: Opus confirms by
comparing anatomy across planes (§5 item 4).

**Reproduce a figure's tips.** In the pipeline venv (`tools/ssb-pipeline/README.md`):

    .venv/bin/python -I tools/ssb-pipeline/uw/figures.py overlay <id> [<id>…] [--out DIR]   # mask, labels, tail→tip
    .venv/bin/python -I tools/ssb-pipeline/uw/figures.py sheet [--out DIR]                    # all traced figures, six to a sheet

The images are fetched into the gitignored `tools/ssb-pipeline/incoming/` on first use; the check PNGs go to the
system temp directory by default, and the script refuses to write them inside the repository. Versions: the
OCR engine and its version are in `meta.method.ocr` (the `requirements.txt` pin was moved to the version that
installs).
