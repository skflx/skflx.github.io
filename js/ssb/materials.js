/* =============================================================
   materials.js — the procedural tissue-material library (docs/ssb.md 7.4).

   One factory per tissue kind of the graph's `kind` vocabulary
   (docs/authoring-ssb.md 6): bone, bone-cut, mucosa, skin, cartilage, dura, fat,
   muscle, artery, vein, nerve, gland, brain — plus the three categorical
   kinds that stay plain tinted surfaces (air-cell, space) and the flow
   pathway roles. Models carry geometry only (docs/ssb.md 5.3), so every
   surface is drawn from its `kind`:

   - MeshStandardMaterial extended through onBeforeCompile: three's
     lighting and shadows stay; a tiny albedo / roughness / height hook is
     added. There are no textures and no UVs. Every pattern is a function of
     the WORLD position in millimetres (1 scene unit = 1 mm), so a pore, a
     vessel or a fat lobule is the same size on every model and stays put
     when the model is rebuilt. Structured 2D patterns (vessels, fibres) are
     projected triplanar; isotropic ones (pores, mottling, lobules) are
     solid 3D noise, which needs no projection at all. Height feeds a
     derivative bump (mm of relief -> a slope, independent of zoom).
   - Detail finer than a pixel fades out from the pixel's footprint in mm,
     so a far view is smooth instead of shimmering.
   - Base colours come from --ssb-* CSS tokens (css/ssb.css), re-read on
     refresh() (scene.js calls it on every html[data-theme] change). A missing
     token draws mid-grey: there is no second copy of the palette here.
   - One compiled program per (kind, hazard, quality): the cache key is set
     explicitly (three would otherwise key on the onBeforeCompile source,
     which is identical for every kind), and materials of one kind share it,
     so many parts do not multiply shader compiles.
   - Quality: 'full' (desktop) or 'lite' (phones, low-end, software GL):
     fewer octaves, no domain warp, at most two projection planes, a plain
     noise stand-in for fat lobules. It is a compile-time define, so a
     change (the #q= hash key) recompiles in place.
   - Nothing is animated: no time uniform, no continuous render. The
     library never asks for a frame, so prefers-reduced-motion needs no
     special case (docs/ssb.md 7.4).
   - A hazard site is hatched in the shader over whatever the tissue looks
     like (relief and gloss are flattened under the stripes), never by
     colour alone (the HUD names it).
   - `xray: true` draws a wall as a fresnel ghost (docs/ssb.md 3, "X-ray"):
     one shell whose opacity rises toward the silhouette, blended plainly
     with no depth write. One tint over one tint composites the same in any
     order, so nothing is sorted and a thick bone envelope still lets the
     air spaces inside it read through.

   three.js is passed in (createMaterials(THREE, …)), never imported, so
   this module loads without WebGL: diorama modules import kind names from
   it, and the tests read its tables in plain Node.
   ============================================================= */

/* ---------------- vocabulary ---------------- */

/* Tissue kinds drawn by a procedural pattern. */
export const TISSUE_KINDS = Object.freeze([
    'bone', 'bone-cut', 'mucosa', 'skin', 'cartilage', 'dura', 'fat', 'muscle', 'artery', 'vein', 'nerve', 'gland', 'brain',
]);
/* Plain tinted kinds: categorical air-cell hues, see-through air spaces, and
   the pathway roles (a computed flow tube and its particles). */
const PLAIN_KINDS = ['air-cell', 'space', 'flow', 'flow-particle'];
export const KINDS = Object.freeze([...TISSUE_KINDS, ...PLAIN_KINDS]);

export function isKind(kind) { return KINDS.includes(kind); }

/* The graph's `kind` values -> the material kind that draws them (null: not
   a surface, e.g. a region). tools/test-ssb.mjs pins this table against the
   vocabulary in docs/authoring-ssb.md. */
const GRAPH_KIND = Object.freeze({
    bone: 'bone', 'bone-part': 'bone', cell: 'air-cell', sinus: 'space', space: 'space', opening: 'space',
    mucosa: 'mucosa', cartilage: 'cartilage', artery: 'artery', vein: 'vein', 'venous-sinus': 'vein',
    nerve: 'nerve', ganglion: 'nerve', dura: 'dura', brain: 'brain', muscle: 'muscle', tendon: 'dura',
    fat: 'fat', gland: 'gland', duct: 'mucosa', ligament: 'dura', region: null,
});
export const GRAPH_KINDS = Object.freeze(Object.keys(GRAPH_KIND));
export function kindForGraph(graphKind) {
    return Object.prototype.hasOwnProperty.call(GRAPH_KIND, graphKind) ? GRAPH_KIND[graphKind] : null;
}

/* ---------------- tokens ---------------- */

/* A computed --ssb-* token as a colour string three.js can parse, else the
   fallback. */
export function token(name, fallback) {
    let value = '';
    try { value = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); } catch (e) { /* no-op */ }
    return /^#[0-9a-f]{3,8}$/i.test(value) || /^rgba?\(/i.test(value) ? value : fallback;
}
const MISSING = 'rgb(128, 128, 128)';   /* a missing token is visible, not a hidden second palette */

/* ---------------- quality ---------------- */

/* 'lite' on the hints that say the GPU or the battery cannot afford full
   detail: a software rasteriser or a known old mobile GPU (renderer string),
   Save-Data, a small-memory or dual-core device, a phone-sized touch screen.
   Every hint is optional; with none, 'full'. The #q= hash key overrides. */
export function detectQuality(env = {}) {
    const nav = env.navigator || (typeof navigator !== 'undefined' ? navigator : {});
    const gpu = String(env.renderer || '');
    if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(gpu)) return 'lite';
    if (/adreno \(tm\) ?[2-4]\d\d|mali-(4|t[6-7])|powervr sgx|apple gpu a[4-8]\b/i.test(gpu)) return 'lite';
    if (nav.connection && nav.connection.saveData) return 'lite';
    if (nav.deviceMemory && nav.deviceMemory <= 2) return 'lite';
    if (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2) return 'lite';
    if (env.coarse && env.shortSide && env.shortSide <= 820) return 'lite';
    return 'full';
}

/* ---------------- GLSL ---------------- */

/* Shared by every patterned kind. All lengths are millimetres of world space. */
const GLSL_COMMON = /* glsl */`
varying vec3 vSsbPos;
varying vec3 vSsbN;
struct SsbSurf { vec3 albedo; float rough; float height; };
float ssbFp;   /* the pixel's footprint on the surface, mm */

#ifdef SSB_LITE
    #define SSB_OCT(FULL, LITE) (LITE)
#else
    #define SSB_OCT(FULL, LITE) (FULL)
#endif

float ssbH21(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
}
float ssbH31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
}
vec3 ssbH33(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.xxy + p.yxx) * p.zyx);
}

/* Value noise (quintic), 2D with its analytic gradient: (value, d/dx, d/dy). */
vec3 ssbN2d(vec2 x) {
    vec2 i = floor(x);
    vec2 f = fract(x);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
    float a = ssbH21(i);
    float b = ssbH21(i + vec2(1.0, 0.0));
    float c = ssbH21(i + vec2(0.0, 1.0));
    float d = ssbH21(i + vec2(1.0, 1.0));
    float k1 = b - a;
    float k2 = c - a;
    float k4 = a - b - c + d;
    return vec3(a + k1 * u.x + k2 * u.y + k4 * u.x * u.y, du * vec2(k1 + k4 * u.y, k2 + k4 * u.x));
}
float ssbN2(vec2 x) { return ssbN2d(x).x; }

float ssbN3(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(
        mix(mix(ssbH31(i), ssbH31(i + vec3(1.0, 0.0, 0.0)), u.x), mix(ssbH31(i + vec3(0.0, 1.0, 0.0)), ssbH31(i + vec3(1.0, 1.0, 0.0)), u.x), u.y),
        mix(mix(ssbH31(i + vec3(0.0, 0.0, 1.0)), ssbH31(i + vec3(1.0, 0.0, 1.0)), u.x), mix(ssbH31(i + vec3(0.0, 1.0, 1.0)), ssbH31(i + vec3(1.0, 1.0, 1.0)), u.x), u.y),
        u.z);
}

const mat3 SSB_R = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64);

/* 1 while a feature of wavelength wl mm is well over a pixel, 0 once it is not. */
float ssbFade(float wl) { return 1.0 - smoothstep(0.25, 0.6, ssbFp / wl); }

/* Fractal solid noise, base wavelength wl mm, roughly 0.5 +- 0.35. Octaves
   finer than the pixel fade out. */
float ssbFbm3(vec3 p, float wl, int oct) {
    vec3 q = p / wl;
    float f = 1.0 / wl;
    float a = 0.5;
    float sum = 0.0;
    float wsum = 0.0;
    for (int i = 0; i < 4; i++) {
        if (i >= oct) break;
        sum += a * (1.0 - smoothstep(0.25, 0.6, ssbFp * f)) * (ssbN3(q) - 0.5);
        wsum += a;
        q = SSB_R * q * 2.03 + 17.1;
        f *= 2.03;
        a *= 0.5;
    }
    return clamp(0.5 + 1.7 * sum / wsum, 0.0, 1.0);
}

/* Triplanar weights from the surface normal: sharp, and a plane far below the
   dominant one is dropped (lite drops more, so at most two are sampled). */
vec3 ssbTriW(vec3 n) {
    vec3 w = pow(abs(n), vec3(6.0));
    float m = max(w.x, max(w.y, w.z));
#ifdef SSB_LITE
    w = max(w - m * 0.45, 0.0);
#else
    w = max(w - m * 0.15, 0.0);
#endif
    return w / (w.x + w.y + w.z);
}
#define SSB_TRI(FN, ZERO, P, W) ( ((W).x > 0.0 ? FN((P).yz) * (W).x : ZERO) + ((W).y > 0.0 ? FN((P).zx) * (W).y : ZERO) + ((W).z > 0.0 ? FN((P).xy) * (W).z : ZERO) )

/* 2D gradient noise with its analytic gradient: (value, d/dx, d/dy), value
   about +-0.7 and centred on 0. Smooth meandering zero contours (value noise
   contours turn at right angles). */
vec2 ssbG22(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    q += dot(q, q.yzx + 33.33);
    return fract((q.xx + q.yz) * q.zy) * 2.0 - 1.0;
}
vec3 ssbG2d(vec2 x) {
    vec2 i = floor(x);
    vec2 f = fract(x);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
    vec2 ga = ssbG22(i);
    vec2 gb = ssbG22(i + vec2(1.0, 0.0));
    vec2 gc = ssbG22(i + vec2(0.0, 1.0));
    vec2 gd = ssbG22(i + vec2(1.0, 1.0));
    float va = dot(ga, f);
    float vb = dot(gb, f - vec2(1.0, 0.0));
    float vc = dot(gc, f - vec2(0.0, 1.0));
    float vd = dot(gd, f - vec2(1.0, 1.0));
    float k = va - vb - vc + vd;
    return vec3(va + u.x * (vb - va) + u.y * (vc - va) + u.x * u.y * k,
        ga + u.x * (gb - ga) + u.y * (gc - ga) + u.x * u.y * (ga - gb - gc + gd) + du * (u.yx * k + vec2(vb, vc) - va));
}

/* Distance in mm from a point of a gradient-noise field (cell size c mm,
   coordinates already divided by c) to its zero contour, from the analytic
   gradient: the contour is a thin line of constant width however the field
   slopes. */
float ssbLine(vec2 q, float c) {
    vec3 g = ssbG2d(q);
    return abs(g.x) / (length(g.yz) + 0.35) * c;
}

/* Jittered cellular noise, 27 neighbours: (F1, F2 - F1, cell id), cell size 1. */
vec3 ssbCell(vec3 x) {
    vec3 b = floor(x);
    float d1 = 9.0;
    float d2 = 9.0;
    float id = 0.0;
    for (int k = 0; k < 27; k++) {
        vec3 c = b + vec3(float(k % 3) - 1.0, float((k / 3) % 3) - 1.0, float(k / 9) - 1.0);
        vec3 r = c + 0.1 + 0.8 * ssbH33(c) - x;
        float d = dot(r, r);
        if (d < d1) { d2 = d1; d1 = d; id = ssbH31(c + 7.7); }
        else if (d < d2) { d2 = d; }
    }
    return vec3(sqrt(d1), sqrt(d2) - sqrt(d1), id);
}

/* Sparse round pits on a plane: at most one per unit cell (presence is the
   fraction of cells that have one), always inside its cell; 1 at a pit's
   centre, 0 outside it. */
float ssbPit2(vec2 x, float presence) {
    vec2 c = floor(x);
    vec3 h = vec3(ssbH21(c + 3.3), ssbH21(c + 11.7), ssbH21(c + 19.1));
    float on = step(1.0 - presence, ssbH21(c + 9.1));
    float r = 0.10 + 0.24 * h.z;
    return on * (1.0 - smoothstep(0.55, 1.0, distance(x, c + r + (1.0 - 2.0 * r) * h.xy) / r));
}

/* Bump from a height field in mm: the slope is height gradient per mm of
   surface (screen derivatives of both), so relief does not change with zoom. */
vec3 ssbPerturb(vec3 pos, vec3 n, float h, float faceDirection) {
    vec3 sx = dFdx(pos);
    vec3 sy = dFdy(pos);
    vec3 r1 = cross(sy, n);
    vec3 r2 = cross(n, sx);
    float det = dot(sx, r1) * faceDirection;
    vec3 grad = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2);
    return normalize(abs(det) * n - grad);
}
`;

/* Each kind supplies ssbKind(p, n, w, ax, base): p world mm, n unit normal,
   w triplanar weights, ax the geometry's fibre axis (zero when it has none),
   base the token colour. */

const GLSL_BONE = /* glsl */`
/* fine pores, and rarer larger foramina (faded once smaller than a pixel) */
float ssbBonePits(vec2 p) {
    return max(ssbPit2(mat2(0.87, -0.5, 0.5, 0.87) * p / 0.4, 0.45) * ssbFade(0.09),
        ssbPit2(mat2(0.6, 0.8, -0.8, 0.6) * p / 1.5 + 7.0, 0.3) * 0.85 * ssbFade(0.3));
}
SsbSurf ssbKind(vec3 p, vec3 n, vec3 w, vec3 ax, vec3 base) {
    SsbSurf s;
    float mott = ssbFbm3(p, 10.0, 2);
    float warm = smoothstep(0.42, 0.68, ssbFbm3(p + 31.0, 16.0, 1));
    float grain = ssbFbm3(p + 5.0, 0.8, SSB_OCT(2, 1));
    float pit = SSB_TRI(ssbBonePits, 0.0, p, w);
    vec3 col = base * (0.90 + 0.20 * mott);
    col = mix(col, col * vec3(1.05, 0.95, 0.82), warm * 0.55);
    col *= 0.95 + 0.10 * grain;
    col = mix(col, base * vec3(0.55, 0.46, 0.36), pit * 0.7);
    s.albedo = col;
    s.rough = (mott - 0.5) * 0.4 + pit * 0.2;
    s.height = (grain - 0.5) * 0.05 - pit * 0.06;
    return s;
}`;

/* The solid cap colour of a cut: flat, with a faint cancellous sponge. */
const GLSL_BONE_CUT = /* glsl */`
SsbSurf ssbKind(vec3 p, vec3 n, vec3 w, vec3 ax, vec3 base) {
    SsbSurf s;
    float sponge = smoothstep(0.40, 0.62, ssbFbm3(p, 1.7, SSB_OCT(2, 1)));
    float speck = ssbFbm3(p + 9.0, 0.45, 1);
    s.albedo = base * (0.90 + 0.14 * sponge + 0.06 * (speck - 0.5));
    s.rough = 0.0;
    s.height = 0.0;
    return s;
}`;

/* Submucosal vessels: a domain-warped contour network, trunks, twigs and
   capillaries as (trunk, twig, capillary) masks. */
const GLSL_MUCOSA = /* glsl */`
uniform vec3 uSsbA;
vec3 ssbVessel(vec2 p) {
    vec2 q = p / 2.4;
#ifndef SSB_LITE
    q += 0.5 * (vec2(ssbN2(q * 1.3 + 7.1), ssbN2(q * 1.3 + 19.7)) - 0.5);
#endif
    vec3 g = ssbG2d(q);
    float pres = 0.35 + 0.65 * smoothstep(0.2, 0.6, ssbN2(p / 9.0 + 41.0));
    float trunk = (1.0 - smoothstep(0.015, 0.13, abs(g.x) / (length(g.yz) + 0.35) * 2.4)) * pres;
#ifdef SSB_LITE
    return vec3(trunk, 0.0, 0.0);
#else
    vec2 q2 = p / 0.95 + g.x * 1.6 + 5.3;
    q2 += 0.4 * (vec2(ssbN2(q2 * 1.7 + 3.3), ssbN2(q2 * 1.7 + 9.1)) - 0.5);
    float twig = (1.0 - smoothstep(0.008, 0.06, ssbLine(q2, 0.95))) * (0.05 + 0.95 * smoothstep(0.35, 0.65, ssbN2(p / 4.0 + 91.0)));
    vec2 q3 = p / 0.5 + 13.7 + ssbN2d(q2 * 0.7).yz * 0.7;
    float cap = (1.0 - smoothstep(0.004, 0.03, ssbLine(q3, 0.5))) * ssbFade(0.09) * smoothstep(0.3, 0.7, ssbN2(p / 3.0 + 57.0));
    return vec3(trunk, twig, cap);
#endif
}
SsbSurf ssbKind(vec3 p, vec3 n, vec3 w, vec3 ax, vec3 base) {
    SsbSurf s;
    vec3 v = SSB_TRI(ssbVessel, vec3(0.0), p, w);
    float seen = ssbFade(0.1);
    float mott = ssbFbm3(p, 14.0, 2);
    float flush = smoothstep(0.40, 0.70, ssbFbm3(p + 23.0, 6.0, 2));
    float wet = smoothstep(0.15, 0.85, ssbFbm3(p + 13.0, 7.0, 2));
    float micro = ssbFbm3(p, 1.1, SSB_OCT(2, 1));
    vec3 col = base * (0.88 + 0.24 * mott);
    col = mix(col, col * vec3(1.07, 0.88, 0.90), flush * 0.6);
    col = mix(col, uSsbA, clamp(v.x * 0.7 + v.y * 0.45 + v.z * 0.22, 0.0, 1.0) * seen);
    s.albedo = col;
    s.rough = -0.14 * wet + (micro - 0.5) * 0.10;
    s.height = (micro - 0.5) * 0.10 + (ssbFbm3(p + 7.0, 5.5, 1) - 0.5) * 0.5;
    return s;
}`;

/* Skin (ST6: the external nose and the vestibule's lining): matte, fine pores,
   a slow flush; no vessels. It has no graph `kind` of its own: a model node
   asks for it through its extras.kind (docs/ssb.md 5.3). */
const GLSL_SKIN = /* glsl */`
float ssbSkinPores(vec2 p) {
    return ssbPit2(mat2(0.87, -0.5, 0.5, 0.87) * p / 0.55, 0.5) * ssbFade(0.12);
}
SsbSurf ssbKind(vec3 p, vec3 n, vec3 w, vec3 ax, vec3 base) {
    SsbSurf s;
    float mott = ssbFbm3(p, 12.0, 2);
    float flush = smoothstep(0.40, 0.70, ssbFbm3(p + 23.0, 8.0, 2));
    float micro = ssbFbm3(p, 1.3, SSB_OCT(2, 1));
    float pore = SSB_TRI(ssbSkinPores, 0.0, p, w);
    vec3 col = base * (0.93 + 0.14 * mott);
    col = mix(col, col * vec3(1.05, 0.93, 0.93), flush * 0.4);
    col = mix(col, col * 0.82, pore * 0.5);
    s.albedo = col;
    s.rough = (micro - 0.5) * 0.12 + pore * 0.1;
    s.height = (micro - 0.5) * 0.06 - pore * 0.05;
    return s;
}`;

const GLSL_CARTILAGE = /* glsl */`
SsbSurf ssbKind(vec3 p, vec3 n, vec3 w, vec3 ax, vec3 base) {
    SsbSurf s;
    float m = ssbFbm3(p, 5.0, SSB_OCT(3, 2));
    float cool = smoothstep(0.40, 0.70, ssbFbm3(p + 3.0, 12.0, 1));
    s.albedo = mix(base * (0.93 + 0.14 * m), base * vec3(0.95, 1.0, 1.04), cool * 0.6);
    s.rough = (m - 0.5) * 0.2;
    s.height = (ssbFbm3(p + 1.0, 1.4, SSB_OCT(2, 1)) - 0.5) * 0.06;
    return s;
}`;

/* Fibres wander: the direction field turns slowly, the grain runs along it.
   ssbFibre is zero-mean; ac is the wavelength across the fibres, al along,
   turn how far (radians) the direction field wanders. */
const GLSL_FIBRE = /* glsl */`
float ssbFibre(vec2 p, float ac, float al, float turn) {
    float a = (ssbN2(p / 9.0 + 3.0) - 0.5) * turn;
    float c = cos(a);
    float sn = sin(a);
    vec2 q = vec2(c * p.x - sn * p.y, sn * p.x + c * p.y);
    float coarse = (ssbN2(vec2(q.x / ac, q.y / al)) - 0.5) * ssbFade(ac);
    float fine = (ssbN2(vec2(q.x / (ac * 0.4) + 7.0, q.y / (al * 0.5))) - 0.5) * ssbFade(ac * 0.4);
    return coarse + 0.6 * fine;
}
/* The same along a geometry-supplied axis: solid noise of the position
   projected off the axis, so it is constant along it. */
float ssbFibreAxis(vec3 p, vec3 ax, float ac, float al) {
    float s = dot(p, ax);
    vec3 pp = p - ax * s;
    float coarse = (ssbN3(pp / ac + ax * (s / al)) - 0.5) * ssbFade(ac);
    float fine = (ssbN3(pp / (ac * 0.4) + ax * (s / (al * 0.5)) + 7.0) - 0.5) * ssbFade(ac * 0.4);
    return coarse + 0.6 * fine;
}`;

const GLSL_DURA = /* glsl */`
${GLSL_FIBRE}
float ssbDuraFibre(vec2 p) { return ssbFibre(p, 0.22, 1.6, 3.0); }
SsbSurf ssbKind(vec3 p, vec3 n, vec3 w, vec3 ax, vec3 base) {
    SsbSurf s;
    float f = SSB_TRI(ssbDuraFibre, 0.0, p, w);
    float sheet = ssbFbm3(p, 6.0, 2);
    s.albedo = base * (0.94 + 0.12 * sheet + 0.32 * f);
    s.rough = -0.08 * f + (sheet - 0.5) * 0.12;
    s.height = f * 0.02;
    return s;
}`;

/* Fat: yellow lobules cut by thin pale septa. */
const GLSL_FAT = /* glsl */`
uniform vec3 uSsbA;
SsbSurf ssbKind(vec3 p, vec3 n, vec3 w, vec3 ax, vec3 base) {
    SsbSurf s;
    float sheen = ssbFbm3(p + 4.0, 9.0, 2);
    float septum;
    float lobe;
    float dome;
#ifdef SSB_LITE
    float rn = ssbFbm3(p, 3.0, 1);
    septum = (1.0 - smoothstep(0.0, 0.05, abs(rn - 0.5))) * ssbFade(0.25);
    lobe = ssbFbm3(p + 11.0, 2.4, 1);
    dome = 0.5;
#else
    vec3 c = ssbCell(p / 2.8);
    septum = (1.0 - smoothstep(0.0, 0.06, c.y)) * ssbFade(0.15);
    lobe = c.z;
    dome = 1.0 - c.x;
#endif
    vec3 col = base * (0.90 + 0.16 * lobe) * (0.94 + 0.10 * sheen);
    col *= mix(0.88, 1.06, dome);
    s.albedo = mix(col, uSsbA, septum * 0.6);
    s.rough = (sheen - 0.5) * 0.2 - 0.05 * lobe;
    s.height = (dome - 0.5) * 0.30 - septum * 0.12;
    return s;
}`;

const GLSL_MUSCLE = /* glsl */`
${GLSL_FIBRE}
float ssbMuscleFibre(vec2 p) { return ssbFibre(p, 0.35, 6.0, 1.2); }
SsbSurf ssbKind(vec3 p, vec3 n, vec3 w, vec3 ax, vec3 base) {
    SsbSurf s;
    float f = dot(ax, ax) > 0.25 ? ssbFibreAxis(p, normalize(ax), 0.35, 6.0) : SSB_TRI(ssbMuscleFibre, 0.0, p, w);
    float band = smoothstep(0.35, 0.65, ssbFbm3(p, 2.4, 1));
    vec3 col = base * (0.94 + 0.08 * band + 0.32 * f);
    col = mix(col, mix(base, vec3(1.0), 0.4), smoothstep(0.16, 0.30, f) * 0.12);
    s.albedo = col;
    s.rough = -0.04 * band - 0.05 * f;
    s.height = f * 0.012;
    return s;
}`;

const GLSL_NERVE = /* glsl */`
${GLSL_FIBRE}
float ssbNerveFibre(vec2 p) { return ssbFibre(p, 0.14, 5.0, 0.5); }
SsbSurf ssbKind(vec3 p, vec3 n, vec3 w, vec3 ax, vec3 base) {
    SsbSurf s;
    float f = dot(ax, ax) > 0.25 ? ssbFibreAxis(p, normalize(ax), 0.14, 5.0) : SSB_TRI(ssbNerveFibre, 0.0, p, w);
    s.albedo = base * (0.94 + 0.70 * f);
    s.rough = -0.10 * f;
    s.height = f * 0.02;
    return s;
}`;

/* Artery and vein: a smooth vessel wall, a hint of mottling. */
const glslVessel = (tone) => /* glsl */`
SsbSurf ssbKind(vec3 p, vec3 n, vec3 w, vec3 ax, vec3 base) {
    SsbSurf s;
    float m = ssbFbm3(p, 1.8, SSB_OCT(2, 1));
    s.albedo = base * (${tone} + 0.14 * m);
    s.rough = (m - 0.5) * 0.12;
    s.height = (m - 0.5) * 0.02;
    return s;
}`;

/* Gland: fine granular lobules, less septum than fat. */
const GLSL_GLAND = /* glsl */`
SsbSurf ssbKind(vec3 p, vec3 n, vec3 w, vec3 ax, vec3 base) {
    SsbSurf s;
    float lobe;
    float dome;
    float seam;
#ifdef SSB_LITE
    lobe = ssbFbm3(p, 1.2, 2);
    dome = lobe;
    seam = 0.0;
#else
    vec3 c = ssbCell(p / 0.7);
    lobe = c.z;
    dome = 1.0 - c.x;
    seam = (1.0 - smoothstep(0.0, 0.20, c.y)) * ssbFade(0.1);
#endif
    vec3 col = base * (0.90 + 0.16 * lobe) * mix(0.96, 1.03, dome);
    s.albedo = mix(col, col * 0.84, seam * 0.7);
    s.rough = (lobe - 0.5) * 0.2;
    s.height = (dome - 0.5) * 0.05 - seam * 0.03;
    return s;
}`;

/* Brain: pale, with sulci as dark warped contours. */
const GLSL_BRAIN = /* glsl */`
float ssbSulcus(vec2 p) {
    vec2 q = p / 6.0;
#ifndef SSB_LITE
    q += 0.5 * (vec2(ssbN2(q * 1.4 + 2.2), ssbN2(q * 1.4 + 8.6)) - 0.5);
#endif
    return 1.0 - smoothstep(0.15, 0.6, ssbLine(q, 6.0));
}
SsbSurf ssbKind(vec3 p, vec3 n, vec3 w, vec3 ax, vec3 base) {
    SsbSurf s;
    float sul = SSB_TRI(ssbSulcus, 0.0, p, w);
    float m = ssbFbm3(p, 8.0, 2);
    s.albedo = base * (0.92 + 0.16 * m) * (1.0 - 0.32 * sul);
    s.rough = (m - 0.5) * 0.15;
    s.height = -sul * 0.25 + (ssbFbm3(p, 2.0, 1) - 0.5) * 0.06;
    return s;
}`;


/* kind -> { token: the --ssb-* colour, rough: base roughness, glsl: the
   pattern (absent: a plain tinted surface), extra: token of a second colour
   the pattern uses, axis: reads the geometry's ssbAxis fibre direction }. */
const SPEC = {
    bone: { token: 'bone', rough: 0.72, glsl: GLSL_BONE },
    'bone-cut': { token: 'bone-cut', rough: 0.9, glsl: GLSL_BONE_CUT },
    mucosa: { token: 'mucosa', rough: 0.3, glsl: GLSL_MUCOSA, extra: 'mucosa-vessel' },
    skin: { token: 'skin', rough: 0.62, glsl: GLSL_SKIN },
    cartilage: { token: 'cartilage', rough: 0.42, glsl: GLSL_CARTILAGE },
    dura: { token: 'dura', rough: 0.55, glsl: GLSL_DURA },
    fat: { token: 'fat', rough: 0.5, glsl: GLSL_FAT, extra: 'fat-septum' },
    muscle: { token: 'muscle', rough: 0.45, glsl: GLSL_MUSCLE, axis: true },
    artery: { token: 'artery', rough: 0.36, glsl: glslVessel('0.93') },
    vein: { token: 'vein', rough: 0.44, glsl: glslVessel('0.90') },
    nerve: { token: 'nerve', rough: 0.44, glsl: GLSL_NERVE, axis: true },
    gland: { token: 'gland', rough: 0.6, glsl: GLSL_GLAND },
    brain: { token: 'brain', rough: 0.5, glsl: GLSL_BRAIN },
    'air-cell': { token: 'cell-ethmoid' },
    space: { token: 'space' },
    flow: { token: 'flow' },
    'flow-particle': { token: 'flow-particle' },
};
const PLAIN_ROUGHNESS = 0.78;

/* The --ssb-* token (without the prefix) a material kind is coloured by, or
   null for an unknown kind. The CT label overlay colours its outlines the
   same way (mode-ct.js), so a structure is one colour in 3D and on CT. */
export function kindToken(kind) {
    return Object.prototype.hasOwnProperty.call(SPEC, kind) ? SPEC[kind].token : null;
}

/* The categorical air-cell hues by identity: each IFAC frontal recess cell
   has its own --ssb-cell-* token (the ethmoid cells without one are slate,
   cell-ethmoid). The frontal-recess diorama and the CT label overlay both
   read this table. */
export const CELL_TINT = Object.freeze({
    's.agger-nasi-cell': 'cell-anc',
    'v.supra-agger-cell': 'cell-sac',
    'v.supra-agger-frontal-cell': 'cell-safc',
    'v.suprabullar-cell': 'cell-sbc',
    'v.suprabullar-frontal-cell': 'cell-sbfc',
    'v.supraorbital-ethmoid-cell': 'cell-soec',
    'v.frontal-septal-cell': 'cell-fsc',
});

/* Every --ssb-* colour token this library reads besides the categorical
   `tint`s (tools/test-ssb.mjs checks each is declared for both themes). */
export const TOKENS = Object.freeze([...new Set([
    ...Object.values(SPEC).flatMap((spec) => [spec.token, spec.extra].filter(Boolean)), 'hazard', 'select',
])]);

/* The X-ray ghost: alpha = base + rim * (1 - |n.v|)^power, one flat tint.
   Clipping chunks are included so a section plane cuts it like any wall. */
const XRAY_VERT = /* glsl */`
#include <common>
#include <clipping_planes_pars_vertex>
varying vec3 vXN;
varying vec3 vXV;
void main() {
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    vXN = normalize( normalMatrix * normal );
    vXV = - mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
    #include <clipping_planes_vertex>
}`;
const XRAY_FRAG = /* glsl */`
uniform vec3 uXColor;
uniform float uXBase;
uniform float uXRim;
uniform float uXPower;
varying vec3 vXN;
varying vec3 vXV;
#include <clipping_planes_pars_fragment>
void main() {
    #include <clipping_planes_fragment>
    float facing = abs( dot( normalize( vXN ), normalize( vXV ) ) );
    float rim = pow( 1.0 - facing, uXPower );
    gl_FragColor = vec4( uXColor, clamp( uXBase + uXRim * rim, 0.0, 1.0 ) );
    #include <colorspace_fragment>
}`;

const HATCH_DECL = 'uniform vec3 uHatch;\nuniform float uHatchScale;\n';
/* Over the finished albedo; stripes are flat and dull (see ROUGH/BUMP below). */
const HATCH_CODE = '\tfloat ssbHatch = step(0.55, fract((gl_FragCoord.x + gl_FragCoord.y) / uHatchScale));\n'
    + '\tdiffuseColor.rgb = mix(diffuseColor.rgb, uHatch, ssbHatch * 0.9);\n';

/* ---------------- the library ---------------- */

/* opts: { token?, pixelRatio?, quality? } -> the library for one renderer. */
export function createMaterials(THREE, opts = {}) {
    const read = opts.token || token;
    const hatchScale = { value: 9 * (opts.pixelRatio || 1) };
    const hatchColor = { value: new THREE.Color() };
    const selectColor = new THREE.Color();
    const secondary = {};          /* kind -> { value: Color }: mucosa vessel, fat septum */
    const cache = new Map();
    let quality = opts.quality === 'lite' ? 'lite' : 'full';

    const swatch = (name) => read('--ssb-' + name, MISSING);

    /* Hook a material into the shared programs. `patterned` kinds get the
       tissue surface; any material may be hatched. The program key is set
       here because three would otherwise key on this function's source,
       which is the same text for every kind. */
    function patch(mat, kind, patterned, hazard) {
        if (!patterned && !hazard) return;
        const spec = SPEC[kind];
        const key = `ssb:${patterned ? kind : 'plain'}${hazard ? ':h' : ''}`;
        mat.customProgramCacheKey = () => key;
        mat.onBeforeCompile = (shader) => {
            let vert = shader.vertexShader;
            let frag = shader.fragmentShader;
            let color = '';
            if (hazard) {
                shader.uniforms.uHatch = hatchColor;
                shader.uniforms.uHatchScale = hatchScale;
                frag = frag.replace('#include <common>', '#include <common>\n' + HATCH_DECL);
            }
            if (patterned) {
                if (spec.extra) shader.uniforms.uSsbA = secondary[kind];
                vert = vert
                    .replace('#include <common>', '#include <common>\nvarying vec3 vSsbPos;\nvarying vec3 vSsbN;\n'
                        + (spec.axis ? 'attribute vec3 ssbAxis;\nvarying vec3 vSsbAxis;\n' : ''))
                    .replace('#include <project_vertex>', '#include <project_vertex>\n\tvSsbPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\n'
                        + '\tvSsbN = mat3(modelMatrix) * objectNormal;\n' + (spec.axis ? '\tvSsbAxis = mat3(modelMatrix) * ssbAxis;\n' : ''));
                frag = frag
                    .replace('#include <common>', '#include <common>\n' + GLSL_COMMON + (spec.axis ? 'varying vec3 vSsbAxis;\n' : '') + spec.glsl + '\n')
                    .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n\troughnessFactor = clamp(roughnessFactor + ssbS.rough, 0.06, 1.0);\n'
                        + (hazard ? '\troughnessFactor = mix(roughnessFactor, 0.85, ssbHatch);\n' : ''))
                    .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n\tnormal = ssbPerturb(-vViewPosition, normal, ssbS.height'
                        + (hazard ? ' * (1.0 - ssbHatch)' : '') + ', faceDirection);\n');
                color = '\tvec3 ssbFw = fwidth(vSsbPos);\n\tssbFp = max(ssbFw.x, max(ssbFw.y, ssbFw.z));\n\tvec3 ssbN = normalize(vSsbN);\n'
                    + `\tSsbSurf ssbS = ssbKind(vSsbPos, ssbN, ssbTriW(ssbN), ${spec.axis ? 'vSsbAxis' : 'vec3(0.0)'}, diffuseColor.rgb);\n`
                    + '\tdiffuseColor.rgb = min(ssbS.albedo, vec3(1.0));\n';
                shader.vertexShader = vert;
            }
            frag = frag.replace('#include <color_fragment>', '#include <color_fragment>\n' + color + (hazard ? HATCH_CODE : ''));
            shader.fragmentShader = frag;
        };
    }

    function paint(entry) {
        const { mat, kind, name, selected, partner } = entry;
        if (entry.xray) {
            /* a selected ghost is tinted with the selection colour and drawn firmer */
            const u = mat.uniforms;
            u.uXColor.value.set(selected || partner ? swatch('select') : swatch(name));
            u.uXBase.value = selected ? 0.22 : partner ? 0.12 : 0.045;
            u.uXRim.value = selected ? 0.8 : 0.7;
            return;
        }
        mat.color.set(swatch(name));
        if (kind === 'flow' || kind === 'flow-particle') {
            mat.emissive.copy(mat.color);
            mat.emissiveIntensity = kind === 'flow' ? 0.35 : 0.8;
        } else {
            mat.emissive.copy(selected || partner ? selectColor : new THREE.Color(0x000000));
            mat.emissiveIntensity = selected ? 0.55 : partner ? 0.22 : 1;
        }
    }

    /* look: { kind, tint?, space?, ghost?, translucent?, doubleSide?, onTop?, opacity?, xray? }: kind
       picks the tissue; onTop turns the depth test off; opacity overrides a
       see-through look's; xray draws the wall as
       a fresnel ghost (xrayMaterial); tint (else the kind's own) names the --ssb-* token,
       so air cells keep their categorical hues. hazard: hatched; selected:
       emissive highlight; partner: the other side of a selected pair, a
       dimmer highlight. One material per combination; programs are shared
       per (kind, hazard). Ghosted walls and air spaces are see-through and
       stay plain: no pattern is spent on them. An unknown kind draws as a
       plain air space (kit.tag rejects one at authoring time). */
    function material(look, { hazard = false, selected = false, partner = false } = {}) {
        const kind = SPEC[look.kind] ? look.kind : 'space';
        if (look.xray) return xrayMaterial(kind, look, { selected, partner });
        const patterned = !!SPEC[kind].glsl && !look.ghost && !look.space;
        const name = look.tint || SPEC[kind].token;
        const key = [patterned ? kind : 'plain:' + kind, name, look.space ? 's' : '', look.ghost ? 'g' : '', look.translucent ? 't' : '',
            look.doubleSide ? 'd' : '', look.onTop ? 'o' : '', look.opacity !== undefined ? 'a' + look.opacity : '', hazard ? 'h' : '', selected ? 'x' : '', partner ? 'p' : ''].join('|');
        if (cache.has(key)) return cache.get(key).mat;
        const mat = new THREE.MeshStandardMaterial({ roughness: patterned ? SPEC[kind].rough : PLAIN_ROUGHNESS, metalness: 0 });
        if (look.space || look.ghost || look.translucent) {
            mat.transparent = true;
            mat.depthWrite = false;
            mat.opacity = look.space ? 0.16 : look.ghost ? 0.1 : 0.55;
            mat.side = THREE.DoubleSide;
        }
        if (look.doubleSide) mat.side = THREE.DoubleSide;
        if (look.onTop) mat.depthTest = false;      /* drawn over what hides it (a selection must be seen) */
        if (look.opacity !== undefined && mat.transparent) mat.opacity = look.opacity;
        if (patterned) {
            if (SPEC[kind].extra && !secondary[kind]) secondary[kind] = { value: new THREE.Color(swatch(SPEC[kind].extra)) };
            if (SPEC[kind].axis) mat.defaultAttributeValues = { ssbAxis: [0, 0, 0] };   /* geometry without a fibre axis */
            mat.defines = { ...mat.defines };
            if (quality === 'lite') mat.defines.SSB_LITE = 1;
        }
        patch(mat, kind, patterned, hazard);
        const entry = { mat, kind, name, selected, partner, patterned };
        paint(entry);
        cache.set(key, entry);
        return mat;
    }

    /* The fresnel ghost of a wall (look.xray). Its tint is the kind's token,
       except bone, which is ghosted in the darker cut-bone colour (ivory would
       vanish on the light stage). One program serves every ghost. */
    function xrayMaterial(kind, look, { selected, partner }) {
        const name = look.tint || (kind === 'bone' ? 'bone-cut' : SPEC[kind].token);
        const key = ['xray', name, selected ? 'x' : '', partner ? 'p' : ''].join('|');
        if (cache.has(key)) return cache.get(key).mat;
        const mat = new THREE.ShaderMaterial({
            vertexShader: XRAY_VERT,
            fragmentShader: XRAY_FRAG,
            uniforms: { uXColor: { value: new THREE.Color() }, uXBase: { value: 0 }, uXRim: { value: 0 }, uXPower: { value: 2.2 } },
            transparent: true, depthWrite: false, side: THREE.DoubleSide, clipping: true,
            forceSinglePass: true,      /* one tint composites the same in any order: no back-then-front passes */
        });
        mat.customProgramCacheKey = () => 'ssb:xray';
        const entry = { mat, kind, name, selected, partner, xray: true };
        paint(entry);
        cache.set(key, entry);
        return mat;
    }

    /* Materials for a part mesh: [cut faces, sides] for a slab with cut: true. */
    function materialsFor(look, hazardSel) {
        if (look.cut) return [material({ ...look, kind: 'bone-cut', tint: undefined }, hazardSel), material(look, hazardSel)];
        return material(look, hazardSel);
    }

    /* Re-read every token (boot, and every html[data-theme] change). */
    function refresh() {
        hatchColor.value.set(swatch('hazard'));
        selectColor.set(swatch('select'));
        for (const [kind, u] of Object.entries(secondary)) u.value.set(swatch(SPEC[kind].extra));
        for (const entry of cache.values()) paint(entry);
    }

    /* 'full' | 'lite'; the patterned programs recompile in place. */
    function setQuality(q) {
        const next = q === 'lite' ? 'lite' : 'full';
        if (next === quality) return false;
        quality = next;
        for (const entry of cache.values()) {
            if (!entry.patterned) continue;
            if (next === 'lite') entry.mat.defines.SSB_LITE = 1; else delete entry.mat.defines.SSB_LITE;
            entry.mat.needsUpdate = true;
        }
        return true;
    }

    return {
        material, materialsFor, refresh, setQuality,
        get quality() { return quality; },
        get count() { return cache.size; },
    };
}
