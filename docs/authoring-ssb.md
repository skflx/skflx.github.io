# Authoring SSB content — the knowledge-graph schema

How to write content for **SSB (Sinus & Skull Base 3D)**. Architecture,
rendering and the phase plan live in `docs/ssb.md`; this file owns the data
shape and the editorial rules. `tools/ssb-content.mjs` enforces the shape
(run by `tools/check-data.mjs` in CI).

## 1. The model in one paragraph

Content is a **typed knowledge graph**, not prose pages. Every fact a
surgeon needs is a node (a structure, a variant, a hazard, a procedure
step) with typed edges to other nodes and to a source. The 3D scene, the
info panels, the CT overlay, the tours and the self-test are all *views* of
the same graph, so a fact is written once and every view stays consistent.
Geometry is keyed by the same ids: a mesh named `s.uncinate-process.R` *is*
the right uncinate process in the graph.

## 2. Files

`ssb/content/<region-set>.json` plus `ssb/content/sources.json`. Each file is
one object whose keys are collections (all optional, all arrays):

```
{ "structures": [], "landmarks": [], "variants": [], "classifications": [],
  "measurements": [], "hazards": [], "principles": [], "procedures": [],
  "stations": [], "pathways": [], "conditions": [], "sources": [] }
```

Ids are global across files; a file may reference any id in any other.

## 3. Ids

`<prefix>.<kebab-slug>` — lowercase ascii, digits, hyphens. Never renamed
once geometry or links use them (add the old slug to `syn` instead of
renaming a display name).

| Prefix | Type | Example |
|---|---|---|
| `s.` | structure | `s.lateral-lamella` |
| `lm.` | landmark (a point) | `lm.sphenoid-ostium` |
| `v.` | variant | `v.supra-agger-frontal-cell` |
| `c.` | classification | `c.keros` |
| `m.` | measurement | `m.aea-to-pea` |
| `h.` | hazard | `h.aea-transection` |
| `pr.` | principle | `pr.skull-base-posterior-to-anterior` |
| `p.` | procedure | `p.draf-iia` |
| `t.` | station (a camera view) | `t.frontal-recess-70` |
| `pw.` | pathway | `pw.frontal-drainage` |
| `dz.` | condition (disease or lesion) | `dz.inverted-papilloma` |
| `src.` | source | `src.wormald-2016-ifac` |

**Laterality lives in geometry, not in ids.** Graph entities are
side-agnostic; mesh and landmark instances append `.R`, `.L` or `.M`
(midline): `s.anterior-ethmoidal-artery.R`.

## 4. Common fields

| Field | Rule |
|---|---|
| `tier` | `1` junior (PGY1–3: names, core relations, CT identification, the structures you must not injure) · `2` senior/boards (variants, classifications, extended FESS, complication management) · `3` fellow/skull base (EEA modules, ICA segments, parasellar and clival anatomy, reconstruction, quantitative data). The UI's depth setting filters on it. |
| `review` | `"draft"` or `"verified"`. **Only the owner sets `verified`** (medical correctness is an owner decision, `docs/decisions.md` §7). A verified entity must cite at least one source, every one of them `verified: true`. The UI marks drafts as unverified. |
| `src` | array of `src.*` ids. Every number and every prevalence cites one. |
| text | Plain text. Two inline forms only: `[[id]]` / `[[id\|label]]` cross-references (rendered as links that fly the camera there) and `*em*` / `**strong**`. No HTML — the renderer escapes everything else. |

## 5. Types

Required fields in **bold**.

**Structure `s.`** — **`id` `name` `kind` `region` `tier` `what` `why` `geo` `src` `review`**, `syn` (search synonyms), `eponym`, `deprecated` (superseded terms, e.g. Kuhn cell types), `partOf` (s-id), `rel` (edges, §6), `ct` (how to find it on CT), `endo` (how it looks and how to find it endoscopically), `reliability` (`constant` / `usual` / `variable` — as a surgical landmark), `pearls` (`[{tier, text}]`, progressive depth).

**Landmark `lm.`** — a named point. **`id` `name` `of` (s-id) `tier` `locate` `review`**, `src`. Its coordinates are specimen data and live in `ssb/geometry/landmarks.json`, never here (`docs/ssb.md` §5.2).

**Variant `v.`** — **`id` `name` `of` `tier` `def` (criteria; CT criteria where they exist) `why` `geo` `src` `review`**, `eponym`, `class` (c-id) + `code` (its code in that classification), `prev` (prevalence, below).

**Prevalence** (inside `v.prev[]`) — **`value`** (string, e.g. `"8–14"`), **`unit`** (`% sides` / `% patients` / `% specimens`), **`method`** (`CT` / `cadaver` / `endoscopic` / `MRI` / `meta-analysis`), **`src`**, **`conf`** (`high` / `med` / `low`), `n`, `population`, `note`. The denominator is mandatory because it is where published prevalences silently disagree (per side vs per patient, CT vs cadaver, and which definition of the cell).

**Classification `c.`** — **`id` `name` `of` `basis` `tier` `classes` `src` `review`**; `classes: [{code, label, criterion, why?}]`, `caveats`. Classes that have geometry map to diorama parameter presets (`docs/ssb.md` §6).

**Measurement `m.`** — **`id` `name` `what` `tier` `unit` `value` `method` `conf` `src` `review`**; `value: {mean?, sd?, median?, range?: [lo, hi]}` (at least one); `from`/`to` (lm-ids, so the model can show its own n=1 value beside the population value), `n`, `population`, `note`.

**Hazard `h.`** — what can go wrong, and the surgeon's full loop around it. **`id` `name` `at` (s-id at risk) `during` (p-ids) `site` `mechanism` `consequence` `prevent` `recognize` `rescue` `tier` `src` `review`**.

**Principle `pr.`** — a rule of thumb a surgeon actually operates by. **`id` `name` `rule` `why` `tier` `src` `review`**, `caveat` (when it fails).

**Procedure `p.`** — **`id` `name` `tier` `indications` `steps` `src` `review`**, `corridor`, `preop` (`[{check, why}]` — the CT review before this operation), `endpoints` (what "complete" means), `pitfalls`. Each step: **`do`**, `see` (ids that come into view), `risk` (h-ids), `think` (the decision or check running in the surgeon's head at this moment), `station` (t-id), `removes` (s-ids resected by this step; the procedure mode hides them from here on).

**Station `t.`** — a named endoscopic or overview camera view. **`id` `name` `side` (`R` / `L` / `either` / `midline`) `scope` (`0` / `30` / `45` / `70`, or `null` for an overview) `where` (scope tip position and direction in words) `shows` (ids) `purpose` `tier`**. The geometry pipeline adds the numeric pose later.

**Pathway `pw.`** — a flow the scene animates. **`id` `name` `kind` (`mucociliary` / `drainage`) `from` `via` (ids, in order) `to` `tier` `src` `review`**, `note`.

**Condition `dz.`** — a disease or lesion, drawn as a layer over the anatomy it involves. **`id` `name` `category` `involves` (s-ids) `tier` `what` `why` (what it changes at the table) `imaging` (`{ct?, mri?}` — the findings that identify it, at least one) `src` `review`**, `syn`, `eponym`, `endo` (endoscopic appearance), `class` (c-ids — its staging or grading systems), `complications` (dz- or h-ids), `managedBy` (p-ids), `mimics` (dz-ids — its imaging differential), `redFlags` (findings that make it urgent or change the operation), `pearls` (`[{tier, text}]`), `geo` (`overlay` — a lesion volume placed on the specimen — or `none`).

**Source `src.`** — **`id` `cite` (Vancouver style) `type` `verified`**, `doi`, `pmid`, `url`. `type`: `consensus` / `classification` / `cadaver` / `CT-series` / `trial` (randomized) / `cohort` / `animal` / `review` / `meta-analysis` / `textbook` / `atlas` (a labeled image atlas: supports identification, not prevalence) — the study design, because it bounds what the source can support (a cadaver series is not a CT prevalence; a primate experiment is not a human threshold). `verified` is `true` only after the citation was matched against PubMed, the DOI resolver or the publisher; never fill a DOI or PMID from memory.

## 6. Vocabularies

**`kind`:** `bone` `bone-part` `cell` `sinus` `space` `opening` `mucosa` `cartilage` `artery` `vein` `venous-sinus` `nerve` `ganglion` `dura` `brain` `muscle` `tendon` `fat` `gland` `duct` `ligament` `region`. The scene draws each kind with a procedural material (`js/ssb/materials.js`, `docs/ssb.md` §7.4); a new kind needs a line in its `GRAPH_KIND` table, and `tools/test-ssb.mjs` fails until the two agree.

**`category`** (conditions): `inflammatory` `infectious` `fungal` `benign-neoplasm` `malignant-neoplasm` `fibro-osseous` `congenital` `cystic` `vascular` `traumatic` `iatrogenic` `idiopathic`.

**`region`:** `nasal-cavity` `septum` `lateral-wall` `maxillary` `lacrimal` `nasopharynx` `ppf` `itf` `ethmoid` `frontal` `olfactory` `orbit` `acf` `sphenoid` `sellar` `parasellar` `suprasellar` `clival` `petrous` `cvj` `multiple` (a container spanning regions, e.g. the specimen's bony envelope).

**`geo`** (how the thing gets geometry, `docs/ssb.md` §5): `specimen` (segmented from the reference CT) · `sweep` (tube along an authored centerline — vessels, nerves, ducts) · `diorama` (parametric teaching model) · `point` (landmark only) · `none` (conceptual).

**Edges `rel: [{r, to, note?}]`** — subject is the entity, object is `to`:

| Group | `r` |
|---|---|
| Spatial (anatomical position) | `medial-to` `lateral-to` `anterior-to` `posterior-to` `superior-to` `inferior-to` |
| Structural | `borders` `wall-of` (say which wall in `note`) `attaches-to` `contains` `passes-through` `transmits` |
| Flow | `drains-to` `opens-into` |
| Neurovascular | `branch-of` `supplies` `innervates` `accompanies` |
| Surgical | `landmark-for` (`to` may be a p-id) |

Spatial edges are testable claims: once landmarks carry coordinates, the
validator checks them against the geometry (`docs/ssb.md` §9).

## 7. Editorial rules

1. **Nomenclature.** Canonical names follow the European Position Paper on
   the Anatomical Terminology of the Internal Nose and Paranasal Sinuses
   (Lund et al. 2014); frontal recess cells follow IFAC (Wormald et al.
   2016). Eponyms go in `eponym`, superseded systems in `deprecated`
   (e.g. `Kuhn type 3 cell`), so search still finds them.
2. **No bare numbers.** Every number carries a unit, a range or spread, a
   method, a population where it matters, and a source. Prefer ranges across
   studies to a single mean; say in `note` when studies disagree and why
   (definition, modality, denominator, population).
3. **Write for the tier.** `what` is readable by an intern; depth goes in
   `why`, `pearls` (tiered) and the higher-tier entities. Do not make a tier
   1 entity depend on tier 3 vocabulary.
4. **Say what the surgeon does with it.** `why` answers "so what, at the
   table?" — what it tells you, what it threatens, what you do about it.
5. **Endoscopic descriptions name side and scope** ("right, 0°, from the
   middle meatus").
6. **No patient data, ever** — no case images or identifiable details. The
   reference specimen is an open, licensed dataset (`docs/ssb.md` §5).
7. **Unsure means `conf: "low"` or no number** — never a guessed value, and
   never an invented citation.
