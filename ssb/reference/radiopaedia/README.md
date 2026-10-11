# Radiopaedia shortlist (RP1)

Candidate cases for the realistic-anatomy exemplars (`docs/realistic-anatomy.md`
§4.3, WP RP1). `cases.json` is a **shortlist of leads, not a source**: no case
here has been read, checked or approved. Opus chooses at most 40; the owner reads
each chosen page in a browser (RA-O5, reopened).

## Method

- Built 2026-10-09 from web-search results restricted to radiopaedia.org. The
  search tool returns paraphrased summaries, not raw snippets, so every
  `reason` is a one-line restatement of what a summary said, unverified against
  the page.
- Per the RP1 ruling, no case page was fetched by script, browser or `curl`.
  Disclosure: two `WebFetch` calls were made on rID 19115 before the ruling was
  read; they returned no licence line or counts and nothing from them is
  recorded beyond what the search also gave.
- A field only the case page shows is the literal string `"owner reads"`, never
  inferred: licence line, planes, series, slice count, window, contrast,
  complete vs key images, burned-in text, and any rID, URL, contributor or
  modality the results did not state.
- `urlCandidates` is used where results gave several URLs and several rIDs and
  did not say which pairs.
- A reason beginning `FLAG:` marks a record whose modality is not CT.
- Queue item keys in `queue` follow the §4.3 search queue. `serves` lists graph
  ids from `ssb/content/` (all exist); `normal asymmetry population` is not a
  graph id.

## Licence

No result showed a per-case licence line, so **every `licence` is `"owner
reads"`**. The site's general terms are CC BY-NC-SA 3.0 (§4.3), but a
contributor may license their own images otherwise. No case may be dropped or
accepted on licence until the page is read; any other line must be flagged.

## Coverage

| Queue item | Result |
|---|---|
| Keros III | `k1` (grade not confirmed) |
| asymmetric ethmoid roof | none found |
| dehiscent lamina papyracea | `lp1` |
| ICA / optic canal dehiscence or protrusion | none found |
| Onodi with optic nerve | `on1` |
| pneumatized anterior clinoid | `acp1` |
| IFAC cells (all six) | none found |
| accessory maxillary ostium | `amo1` |
| pneumatized uncinate | `pu1` (title only, no URL) |
| AEA below skull base | none found |
| sphenoid septum on carotid | none found |
| conchal / presellar | none found |
| postsellar | `ps1` |
| septal deviation (Mladina) | `sd1`, `sd2` (no type stated) |
| silent sinus | `ss1`, `ss2` |
| sinonasal polyposis | `pp1`, `pp2` |
| AFRS | `af1`, `af2` |
| fungal ball | none found |
| acute invasive fungal | `ai1`, `ai2` (MRI) |
| inverted papilloma | `ip1`, `ip2` |
| JNA | `jn1`–`jn4` |
| fibrous dysplasia | `fd1`–`fd3` |
| osteoma | `os1`–`os6` |
| mucocele | `mu1`–`mu3` |
| antrochoanal polyp | `ac1`, `ac2` |
| encephalocele / CSF leak | `cs1`–`cs5` |
| normal sinus CT | `nm1`–`nm5` |

"None found" means no case page surfaced; the queries are in `noneFound`. The
radiopaedia articles on the IFAC cells, Kuhn classification, optic nerve and
anterior ethmoidal notch exist but are articles, not cases. Near misses
rejected: an ICA aneurysm eroding into the sphenoid (rID 7956, pathology, not a
variant); retropharyngeal kissing-carotid cases (not intrasphenoid); two
osteoma cases (plain radiograph; post-treatment CT). A search engine's index of
radiopaedia cases is incomplete, so "none found" is a search result, not proof
of absence: the owner's own radiopaedia search is the next step for those items.

## Next

Opus ranks and picks at most 40; the owner opens each pick, reads every
`"owner reads"` field, and flags licences. RP2 waits on that.
