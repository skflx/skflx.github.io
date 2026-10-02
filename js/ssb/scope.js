/* =============================================================
   scope.js — the rigid endoscope's geometry (docs/ssb.md 3, Endoscope).

   Pure math: no DOM, no three.js, no imports, so Node tests it and state.js
   can take its hash codec. Vectors are RAS millimetres [R, A, S], angles
   degrees. The pose is { side, depth, yaw, pitch, roll, lens }:

   - The scope pivots at the fulcrum F (the nostril, lm.naris.<side>). The
     shaft direction is d = (cos p sin y s) R + (cos p cos y)(-A) + (sin p) S,
     s = +1 for the right nostril, -1 for the left: yaw 0 / pitch 0 points
     straight posterior, yaw + swings the tip laterally on the scope's own
     side, pitch + goes up. The tip is T = F + depth d.
   - The telescope looks off the shaft by the lens angle toward the roll:
     u0 = S projected perpendicular to d (A if the shaft is near vertical),
     w = d x u0, o = cos(roll) u0 + sin(roll) w, v = cos(lens) d + sin(lens) o.
     Roll 0 with a 30 degree lens therefore looks up.
   - The camera head stays upright while the telescope rotates (the real
     technique): the camera's up is u0, carried into the oblique view by the
     lens's own deflection (the rotation about d x o that takes d to v), so
     up = cos(roll)(cos(lens) o - sin(lens) d) - sin(roll)(d x o). Unlike S
     projected perpendicular to v, this has no singularity: the image does
     not spin when a 45 or 70 degree view passes the vertical (looking up
     into the frontal recess). The light post sits at the image edge
     opposite o's projection onto the image.

   `#scope=side,depth,yaw,pitch,roll,lens` is untrusted input: parseScope
   whitelists the side and the lens, clamps the numbers to RANGES and returns
   null for anything that is not six well-formed fields.
   ============================================================= */

export const LENSES = Object.freeze([0, 30, 45, 70]);
export const SIDES = Object.freeze(['R', 'L']);
export const RANGES = Object.freeze({
    depth: Object.freeze({ min: 0, max: 120, step: 0.5 }),
    yaw: Object.freeze({ min: -45, max: 45, step: 1 }),
    pitch: Object.freeze({ min: -45, max: 45, step: 1 }),
    roll: Object.freeze({ min: 0, max: 359, step: 1 }),
});
export const POSE_DEFAULT = Object.freeze({ side: 'R', depth: 40, yaw: 0, pitch: 0, roll: 0, lens: 0 });
export const FOV_DEG = 70;               /* the circular field of view's full angle */

const RAD = Math.PI / 180;
const HASH_MAX = 96;
const S_AXIS = Object.freeze([0, 0, 1]);
const A_AXIS = Object.freeze([0, 1, 0]);

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const norm = (a) => { const n = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / n, a[1] / n, a[2] / n]; };

/* `a` with its component along unit `n` removed, normalised. */
const perp = (a, n) => norm(sub(a, scale(n, dot(a, n))));

const num = (v) => String(Number(Number(v).toFixed(2)));

/* One field -> a finite number clamped to its range and snapped to its step, or null. */
export function clampField(key, raw) {
    const r = RANGES[key];
    if (!r || raw === null || raw === undefined || typeof raw === 'boolean') return null;
    if (typeof raw === 'string' && raw.trim() === '') return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    const v = Math.min(r.max, Math.max(r.min, r.min + Math.round((n - r.min) / r.step) * r.step));
    return Number(v.toFixed(6));
}

/* Any object -> a whole, in-range pose (missing or bad fields take the default),
   or null when it is not an object. A lens outside the whitelist is the default. */
export function clampPose(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const pose = { ...POSE_DEFAULT };
    if (SIDES.includes(raw.side)) pose.side = raw.side;
    for (const key of Object.keys(RANGES)) {
        const v = clampField(key, raw[key]);
        if (v !== null) pose[key] = v;
    }
    const lens = Number(raw.lens);
    if (typeof raw.lens !== 'boolean' && LENSES.includes(lens)) pose.lens = lens;
    return pose;
}

/* 'R,40,0,0,0,30' -> a pose, or null unless it is exactly six fields whose side
   and lens are on the whitelists and whose numbers are finite (they clamp). */
export function parseScope(text) {
    if (typeof text !== 'string' || text.length > HASH_MAX) return null;
    const f = text.split(',');
    if (f.length !== 6 || !SIDES.includes(f[0]) || !LENSES.includes(Number(f[5])) || f[5].trim() === '') return null;
    const pose = { ...POSE_DEFAULT, side: f[0], lens: Number(f[5]) };
    const keys = ['depth', 'yaw', 'pitch', 'roll'];
    for (let i = 0; i < 4; i++) {
        const v = clampField(keys[i], f[i + 1]);
        if (v === null) return null;
        pose[keys[i]] = v;
    }
    return pose;
}

export function formatScope(p) {
    return [p.side, num(p.depth), num(p.yaw), num(p.pitch), num(p.roll), p.lens].join(',');
}

export function samePose(a, b) {
    if (a === b) return true;
    return !!a && !!b && a.side === b.side && a.depth === b.depth && a.yaw === b.yaw && a.pitch === b.pitch && a.roll === b.roll && a.lens === b.lens;
}

/* The shaft's unit direction d (RAS). */
export function shaftDir(p) {
    const y = p.yaw * RAD;
    const pi = p.pitch * RAD;
    const sigma = p.side === 'L' ? -1 : 1;
    return [Math.cos(pi) * Math.sin(y) * sigma, -Math.cos(pi) * Math.cos(y), Math.sin(pi)];
}

/* The tip: F + depth d. */
export function tipOf(fulcrum, p) {
    return add(fulcrum, scale(shaftDir(p), p.depth));
}

/* Everything the view needs from a pose, in RAS: shaft d, tip offset direction
   o, view v, image up and right, the light post's image-plane direction. */
export function frameOf(p) {
    const d = shaftDir(p);
    const u0 = Math.abs(dot(d, S_AXIS)) > 0.99 ? perp(A_AXIS, d) : perp(S_AXIS, d);
    const w = cross(d, u0);
    const roll = p.roll * RAD;
    const lens = p.lens * RAD;
    const o = add(scale(u0, Math.cos(roll)), scale(w, Math.sin(roll)));
    const v = norm(add(scale(d, Math.cos(lens)), scale(o, Math.sin(lens))));
    const n = cross(d, o);
    const up = norm(sub(scale(sub(scale(o, Math.cos(lens)), scale(d, Math.sin(lens))), Math.cos(roll)), scale(n, Math.sin(roll))));
    const right = norm(cross(v, up));
    const px = -dot(o, right);
    const py = -dot(o, up);
    const m = Math.hypot(px, py) || 1;
    return { d, o, v, up, right, post: [px / m, py / m] };      /* the light post's image-plane (right, up) direction */
}

/* The light post's clock angle: degrees counterclockwise from image-right. */
export function lightPostAngle(p) {
    const { post } = frameOf(p);
    return (Math.atan2(post[1], post[0]) / RAD + 360) % 360;
}

/* The vertical field of view (degrees) that puts the FOV_DEG circle inside a
   canvas of width x height: the circle's diameter is the shorter side. */
export function verticalFov(width, height) {
    const m = Math.max(1, Math.min(width, height));
    return 2 * Math.atan(Math.tan((FOV_DEG / 2) * RAD) * (Math.max(1, height) / m)) / RAD;
}
