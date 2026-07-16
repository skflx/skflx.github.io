/* =============================================================
   kag-enums.mjs — the KAG schema enums, in ONE place.

   Single source of truth for both tools/kag-validate.mjs (shard
   merge) and tools/check-data.mjs (committed-data audit). These are
   the contract documented in docs/kag-schema.md; keep them in sync
   with that doc. Pure data, no side effects, zero dependencies.
   ============================================================= */
export const NODE_TYPES = ['anatomy', 'pathology', 'procedure', 'nerve', 'vessel', 'drug', 'concept'];
export const SUBSPECIALTIES = ['otology', 'rhinology', 'laryngology', 'hn_onc', 'fprs', 'pediatrics', 'sleep', 'endocrine', 'fundamentals'];
/* legacy subspecialty aliases → canonical key (seen in old shards) */
export const SUB_MAP = { 'head-neck-onc': 'hn_onc', 'peds-ent': 'pediatrics', 'facial-plastics': 'fprs', 'skull-base': 'otology' };
export const STRUCTURES = ['bone', 'cartilage', 'ligament', 'fascia', 'joint', 'foramen', 'space', 'membrane', 'muscle'];
export const REGIONS = ['temporal-bone', 'skull-base', 'facial-skeleton', 'nasal-sinus', 'larynx', 'neck', 'oral-pharynx', 'cervical-spine-hyoid', 'external-ear'];
export const LATERALITIES = ['midline', 'paired'];
export const EDGE_TYPES = ['innervates', 'supplies', 'drains_to', 'landmark_for', 'complication_of', 'differentiates_from', 'treats', 'staged_with', 'arises_from', 'contained_in', 'branches_from', 'articulates_with', 'attaches_to', 'part_of', 'bounded_by', 'continuous_with', 'passes_through', 'transmits', 'suspends', 'forms'];
export const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
