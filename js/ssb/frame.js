/* =============================================================
   frame.js — the one RAS <-> scene conversion (docs/ssb.md 4).

   Authored and pipeline data are RAS millimetres (x patient right,
   y anterior, z superior); three.js is Y-up and right-handed. This is the
   only place the mapping is written. scene.js re-exports rasToScene, and
   the dioramas import it from here so their modules stay free of three.js
   (they are also loaded by graph mode, for the URL whitelist).
   ============================================================= */

/* RAS mm -> three.js scene (1 unit = 1 mm). */
export function rasToScene(p) {
    return [p[0], p[2], -p[1]];
}

/* three.js scene -> RAS mm (the inverse; used to read geometry back). */
export function sceneToRas(p) {
    return [p[0], -p[2], p[1]];
}
