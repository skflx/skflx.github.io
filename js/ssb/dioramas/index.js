/* =============================================================
   dioramas/index.js — the diorama registry (docs/ssb.md 6).

   name -> module. Each module exports TITLE, PARAMS, PRESETS, VIEWS,
   VIEW_DEFAULT, classify(params), readout(params, userData, names) and
   build(THREE, params); none imports three.js, so this
   registry is loaded with graph mode and state.js whitelists `#lab=` against
   it even where WebGL is missing.
   ============================================================= */
import * as ethmoidRoof from './ethmoid-roof.js?v=8beb280c';
import * as frontalRecess from './frontal-recess.js?v=6ffe115c';
import * as sphenoid from './sphenoid.js?v=57b6e2f1';

export const DIORAMAS = Object.freeze({
    'ethmoid-roof': ethmoidRoof,
    'frontal-recess': frontalRecess,
    sphenoid,
});

/* The shape state.js whitelists against: name -> { params, presets }. */
export const LAB_SPECS = Object.freeze(Object.fromEntries(
    Object.entries(DIORAMAS).map(([name, m]) => [name, { params: m.PARAMS, presets: m.PRESETS }]),
));
