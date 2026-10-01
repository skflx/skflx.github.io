# Gaps: UW sinus atlas terms vs. the SSB graph

Derived from `crosswalk.json` (55 `none`, 7 `partial` out of 148 terms). See
`labels.json` for where each term appears on the UW site.

## The big picture

The `none`/`partial` terms split into two very different buckets:

1. **Anatomy genuinely outside the current ventral-skull-base/sinus corridor**
   (cranial vault, mandible/TMJ, temporal bone/otology, jugular foramen
   region). These are almost all one-off labels UW uses only to orient the
   viewer on a scroll through the whole head — not omissions.
2. **Almost the entire "Abnormal" half of the UW site** — general
   inflammatory sinus disease, its imaging findings, and its complications.
   This is the real finding: SSB's content model (`docs/authoring-ssb.md`)
   types nodes as structure / landmark / variant / classification /
   measurement / hazard / principle / procedure / station / pathway. There is
   no "disease" or "pathology" node kind, and `hazards` are scoped to
   *surgical* complications, not primary sinus disease. Every UW disease
   entity below (sinusitis, mucus retention cyst, polyp, mucocele-as-primary-
   disease, osteoma, the Rice/Zinreich disease-pattern classification, and
   the orbital/intracranial complications of sinusitis) falls through that
   gap not because anyone missed it, but because SSB hasn't decided whether
   inflammatory-disease teaching is in scope at all. **Recommend the owner
   make that call explicitly** rather than trickling pathology in ad hoc:
   if in scope, it likely wants its own node kind (and probably its own
   content file) rather than being squeezed into `variants` or `hazards`.

## Structures

| Term | SSB should add it? |
|---|---|
| C1 ring (graph has only the anterior arch) | Low priority — the anterior arch id already covers the surgically relevant part (transodontoid approach); skip. |
| basiocciput / basisphenoid (fuse into clivus/sphenoid body in the adult) | Skip — these are embryologic/pre-fusion names for parts already covered by `s.clivus` / `s.sphenoid-bone`; adding them would duplicate, not extend. |
| petrous carotid canal | **Add.** `p.medial-petrous-apex-approach` already exists; the bony canal around the petrous ICA is a natural companion structure id for that approach. |
| foramen spinosum | **Add.** Immediate neighbor of the already-modeled `s.foramen-ovale`, and a standard landmark for the middle meningeal artery in transpterygoid dissection. |
| retroantral fat pad | **Add.** A named surgical landmark on the UW site and relevant to `p.prelacrimal-approach` / `p.canine-fossa-trephination`. |
| nasopalatine foramen, palatine process of the maxilla, alveolar ridge | Skip for now — hard-palate/maxillectomy-corridor detail beyond current phase; revisit if a palate/maxillectomy module is planned. |
| sphenooccipital synchondrosis | Skip — minor, not surgically load-bearing in the endonasal corridor. |
| jugular foramen, jugular tubercle, jugular bulb | **Ask the owner** — these sit just past the current far-lateral/petroclival boundary; worth confirming whether that's an intentional phase boundary (per `docs/ssb.md`) before adding. |
| coronal/sphenozygomatic/sphenotemporal/zygomaticofrontal/squamosal sutures, zygomatic arch/bone, nasal bone, alveolar ridge | Skip — cranial-vault and facial-buttress anatomy, outside the ventral skull-base scope by design. |
| mandible, mandibular condyle/fossa/head, coronoid process, articular eminence | Skip — TMJ/mandible anatomy, out of scope. |
| cochlea, ossicles, internal auditory canal, mastoid air cells | Skip — otologic/temporal-bone anatomy, out of scope. |

## Variants

| Term | SSB should add it? |
|---|---|
| hypoplastic sphenoid sinus | **Add**, for symmetry — `v.maxillary-sinus-hypoplasia` and `v.frontal-sinus-aplasia` already exist; a sphenoid counterpart is a natural, low-effort completion. |
| overly pneumatized frontal sinus | Skip — just describes a degree of normal `s.frontal-sinus` pneumatization, not a distinct entity. |

## Pathology (see "the big picture" above)

All of the following are `none` because SSB has no disease/pathology node
kind yet, not because any single one was overlooked:

acute sinusitis · air-fluid level · "bubbly"/"foamy" secretions · mucosal
thickening · aggressive sinusitis with bony erosion · mucus retention cyst ·
maxillary sinus polyp · antrochoanal polyp · sinonasal polyposis · osteoma ·
mycetoma (fungal ball) · inspissated secretions · sinus hemorrhage ·
epidural abscess · subdural empyema · brain abscess (sinugenic) · meningitis
(sinugenic) · orbital cellulitis / orbital extension of disease (`partial`:
the graph's `c.chandler` classification names the complication tiers without
modeling the disease itself) · subperiosteal / retrobulbar abscess · optic
neuritis · ophthalmic vein thrombosis · cavernous sinus thrombosis ·
infundibular / OMU / sphenoethmoidal-recess inflammatory-disease-pattern
classification (Rice/Zinreich) · mucocele-as-primary-disease (`partial`:
`h.mucocele-after-obliteration` only covers the post-surgical case).

**Recommendation**: don't add these one at a time as `hazards`; decide the
node-kind question first, then batch-add as a set (they're taught together
on the UW site and would read better together in SSB too).

## Synonyms to add to existing graph entities

So search finds UW's (and generally older/more clinical) phrasing:

| id | add synonym |
|---|---|
| `s.frontal-process-maxilla` | "anterior process of the maxilla" |
| `s.perpendicular-plate` | "ethmoid plate" |
| `s.infraorbital-foramen` | "inferior orbital foramen" |
| `s.carotid-prominence` | "carotid canal" *(caveat: risk of confusion with the true temporal-bone carotid canal — consider phrasing as "carotid canal (sphenoid wall bulge)" if added)* |
| `s.optic-prominence` | "optic eminence" |
| `s.petroclival-synchondrosis` | "petro-occipital fissure" |
| `s.sphenoid-lateral-recess` / `v.lateral-recess-pneumatization` | "pneumatized pterygoid plates" (UW's phrasing for lateral sphenoid recess pneumatization extending into the pterygoid process) |
