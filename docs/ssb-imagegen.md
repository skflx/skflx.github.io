# SSB — image-generation and cross-model briefs

Ready-to-run briefs for work a different model does better or more
independently than Claude. The repo holds no API keys (`CLAUDE.md`), so the
owner runs these in the Gemini app and drops the results where each brief
says. Why these and nothing else: `docs/ssb.md` §11. The rule that governs
all of them: **generated pixels never carry an anatomical claim.**

## 1. Endoscope-mode surface textures (phase 8)

Procedural shaders ship first; these refine them. One image per prompt.
Save as `tools/ssb-pipeline/incoming/<name>.png`; the pipeline's texture
ingest step checks and converts them to `ssb/textures/<name>.webp`.

Prefix every prompt with this block:

> Generate a single seamless, tileable square texture, 2048×2048, for a
> real-time 3D renderer. Requirements: flat, even, diffuse illumination with
> no directional light, no shadows, no specular highlights, no vignette, no
> lens effects; the pattern must tile with no visible seams on all four
> edges; no text, watermark, border, instruments, or recognizable anatomy;
> fill the frame edge to edge with surface only; photographic realism at a
> scale where the tile spans about 10 millimetres of tissue.

| `<name>` | Prompt body (after the prefix) |
|---|---|
| `mucosa-healthy` | Healthy human nasal respiratory mucosa as seen under endoscopic LED light: moist pale-pink to salmon surface, fine branching submucosal capillary network, faint cobblestone texture. |
| `mucosa-inflamed` | Inflamed, congested human nasal mucosa: deeper red, oedematous and swollen texture, prominent dilated vessels, patchy thin mucus film. |
| `bone-exposed` | Exposed thin human facial bone after mucosa is elevated: ivory to pale yellow cortical surface, faint vascular foramina and fine pitting. |
| `bone-drilled` | Human bone freshly drilled with a diamond burr: smooth matte ivory surface with fine concentric burr marks and tiny exposed trabecular pores. |
| `dura` | Human dura mater: grey-white dense fibrous sheet with a subtle woven fibre direction and a few fine meningeal vessels. |
| `orbital-fat` | Human periorbital fat: bright yellow lobulated fat with thin translucent septa between lobules. |

**Accept an image only if:** a 2×2 tiling shows no seam; the four
quadrants' mean brightness is within about 5% of each other (no baked
lighting); nothing in it reads as a specific structure. The ingest step
checks the first two mechanically; the third is the owner's eye.

## 2. Illustration plates (later; optional)

Input is always our own render — never a from-scratch prompt. The viewer
exports a plate pair: `plate-<view>.png` (flat-shaded render) and
`plate-<view>-edges.png` (outline pass).

> Restyle the attached image as a classic medical illustration (fine ink
> line work with soft watercolour washes). Do not move, add, remove,
> reshape or relabel anything; preserve every contour exactly where it is.
> Add no text, arrows or labels.

Accept only if the plate's edge map overlays `plate-<view>-edges.png`
within tolerance (the ingest step measures it). Labels are added by the
viewer as SVG, never generated.

## 3. Cross-family content audit (any time the graph grows)

Errors that Claude authored and Claude reviewed can share a blind spot. A
different model family is an independent check. Upload the
`ssb/content/*.json` files to Gemini (Deep Research mode if available) with:

> You are auditing a draft knowledge graph for an educational 3D atlas of
> the paranasal sinuses and ventral skull base, written for residents
> through fellowship-trained rhinologists and skull base surgeons. The
> files are JSON; the schema is: structures (`s.*`), variants (`v.*`, with
> prevalence `prev`), classifications (`c.*`), measurements (`m.*`), hazards
> (`h.*`), principles (`pr.*`), procedures (`p.*`), sources (`src.*`).
> Find factual errors only — wrong anatomy, wrong spatial relations, wrong
> classification criteria, numbers outside the published range, wrong
> denominators (per side vs per patient), prevalences that ignore how
> strongly the definition or modality changes the figure, and citations
> that do not exist or do not support the claim. For each finding output one
> line: `<entity id> | <field> | <what is wrong> | <correct statement> |
> <source you checked, with DOI or PMID>`. Do not rewrite style. Do not
> report anything you cannot source. If you find nothing in an entity, say
> nothing about it.

Save the answer as `tools/ssb-pipeline/incoming/audit-<date>.txt` (not
served, not committed unless the owner wants it) and hand it to Claude to
triage against the sources; accepted fixes land as normal edits, still
`draft` until the owner verifies.
