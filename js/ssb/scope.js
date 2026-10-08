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

   Collision (E3) is pure here too, against any `ctAt(ras) -> display level`:
   the shaft is sampled every 0.5 mm from START_MM to the tip, on its axis and
   on a ring of four points at the shaft radius, and is blocked by bone only
   (display >= BONE_LEVEL). Mucosa and turbinates (SOFT_LEVEL..BONE_LEVEL) do
   not block: this specimen is not decongested and a rigid scope displaces
   mucosa, so blocking at the air threshold would wall off the sphenoid and
   frontal ostia. The shaft length lying in mucosa is reported instead.

   The septum (E3b) is not bone at this level (cartilage and mucosa, display <= ~120), so a second rule keeps
   the rigid shaft on its own side of the midline: a sample point (axis or ring) with s * R < 0 (s = +1 right
   scope, -1 left) blocks, except in the nasopharynx, behind and below the choanal arch. The midline is R = 0
   because the standard specimen (N1, docs/ssb.md 5.1) centres the septum there.
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

/* Collision: the shaft's radius (a 4 mm telescope, owner decision O4; 2.7 mm is selectable, never in the hash),
   the CT display levels (meshes.py: BONE_LEVEL 150, the air threshold 78) and the sampling. */
export const SHAFT_RADII = Object.freeze({ '4': 2.0, '2.7': 1.35 });
export const SHAFT_RADIUS_MM = SHAFT_RADII['4'];
export const BONE_LEVEL = 150;
export const SOFT_LEVEL = 78;
/* `levels` is { soft, bone } in the volume's own values (ct.json `levels`: air -> soft); a 16-bit head passes HU. */
export const LEVELS_DEFAULT = Object.freeze({ bone: BONE_LEVEL, soft: SOFT_LEVEL });
export const SAMPLE_STEP_MM = 0.5;
export const START_MM = 2;
/* lm.choanal-arch.M's [A, S], used when the landmark is missing: the nasopharynx is A < arch.a and S < arch.s. */
export const ARCH_DEFAULT = Object.freeze({ a: -51, s: 12 });

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

/* ---------------- stations (E6) ---------------- */

/* `#scope=t.<id>[.<side>]` is a station link: a graph station id (lowercase words joined by hyphens) and an optional
   side. It is untrusted input like the pose form: the whitelist is the shape, and what it names is only ever a
   lookup key into the station table (resolveStation), never markup or a path. Returns { id, side } (side null when
   absent) or null. */
const STATION_LINK = /^(t\.[a-z0-9]+(?:-[a-z0-9]+)*)(?:\.(R|L|M))?$/;
export function parseStationLink(text) {
    if (typeof text !== 'string' || text.length > HASH_MAX) return null;
    const m = STATION_LINK.exec(text);
    return m ? { id: m[1], side: m[2] || null } : null;
}

/* ssb/geometry/stations.json -> Map("t.<id>.<side>" -> { id, side, pose }). Only the `stations` table is read; an
   entry whose key is not `t.<id>.R|L|M` or whose pose is not whole (a side R or L, the four numbers, a whitelisted lens)
   is skipped, the numbers clamp to RANGES like any pose. A `shaft` of "2.7" is kept (the pose is free only for the 2.7 mm telescope, WP P3); any other value is none. A midline (.M) station is posed from the right nostril. A
   malformed document is an empty map: the station list then hides and a station link is ignored. */
export function parseStations(doc) {
    const out = new Map();
    const table = doc && typeof doc === 'object' ? doc.stations : null;
    if (!table || typeof table !== 'object' || Array.isArray(table)) return out;
    for (const [key, entry] of Object.entries(table)) {
        const m = /^(t\.[a-z0-9]+(?:-[a-z0-9]+)*)\.(R|L|M)$/.exec(key);
        const raw = entry && typeof entry === 'object' ? entry.pose : null;
        if (!m || !raw || typeof raw !== 'object' || !SIDES.includes(raw.side) || !LENSES.includes(raw.lens)) continue;
        if (!Object.keys(RANGES).every((k) => clampField(k, raw[k]) !== null)) continue;
        /* `shaft` ("4" | "2.7"): the telescope the pose needs; null = any (the 4 mm default) */
        const shaft = typeof entry.shaft === 'string' && Object.prototype.hasOwnProperty.call(SHAFT_RADII, entry.shaft) && entry.shaft !== '4' ? entry.shaft : null;
        out.set(key, { id: m[1], side: m[2], pose: clampPose(raw), shaft });
    }
    return out;
}

/* A parsed link -> its entry in a parseStations map, or null. The side defaults to R; with no side given a midline
   station (.M) is the fallback, so `t.nsf-pedicle` finds it. A side that is named must exist. */
export function resolveStation(stations, link) {
    if (!(stations instanceof Map) || !link) return null;
    const key = `${link.id}.${link.side || 'R'}`;
    const hit = stations.get(key) || (link.side ? null : stations.get(`${link.id}.M`));
    return hit || null;
}

/* The pose halfway along the flight from `a` to `b` (e in 0..1, already eased): depth, yaw and pitch go straight, roll
   goes the shortest way round, the side is the target's from the first step (a different fulcrum has no halfway) and
   the lens is the target's only once the flight ends (e >= 1). The store snaps each step to RANGES. */
export function flightPose(a, b, e) {
    if (e >= 1) return { ...b };
    const lerp = (x, y) => x + (y - x) * e;
    const turn = ((b.roll - a.roll + 540) % 360) - 180;
    return { side: b.side, depth: lerp(a.depth, b.depth), yaw: lerp(a.yaw, b.yaw), pitch: lerp(a.pitch, b.pitch), roll: (a.roll + turn * e + 360) % 360, lens: a.lens };
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

/* ---------------- collision ---------------- */

/* Sample the shaft of `pose` (fulcrum F) against ctAt(ras) -> the volume's value (NaN = outside the volume = free; 0 is no data on a u8 head).
   `arch` is { a, s }: the choanal arch's A and S (the midline rule's nasopharynx exemption; ARCH_DEFAULT).
   Returns { depth, blocked, by, contactMm }: `depth` is the pose's depth, or the last free sample when bone or
   the midline blocks first (a pose that would block is clamped, not refused); `by` is 'bone' or 'septum' (the
   midline rule fired and bone did not at that sample), null when free; `contactMm` is the length of the axis
   lying in mucosa (levels.soft <= level < levels.bone) up to that depth. */
export function shaftClearance(fulcrum, pose, ctAt, radius = SHAFT_RADIUS_MM, arch = ARCH_DEFAULT, levels = LEVELS_DEFAULT) {
    const { bone: boneLevel, soft: softLevel } = levels;
    const d = shaftDir(pose);
    const e1 = perp(Math.abs(dot(d, S_AXIS)) > 0.99 ? A_AXIS : S_AXIS, d);
    const e2 = cross(d, e1);
    const ring = [e1, e2, scale(e1, -1), scale(e2, -1)].map((e) => scale(e, radius));
    const level = (p) => { const v = ctAt(p); return v === v ? v : -Infinity; };      /* outside the volume: neither bone nor mucosa, on any head's scale */
    const sigma = pose.side === 'L' ? -1 : 1;
    const crossed = (p) => sigma * p[0] < 0 && !(p[1] < arch.a && p[2] < arch.s);
    let contact = 0;
    let last = Math.min(pose.depth, START_MM - SAMPLE_STEP_MM);       /* the last depth known free */
    const steps = Math.floor((pose.depth - START_MM) / SAMPLE_STEP_MM + 1e-9) + 1;
    for (let n = 0; n <= steps; n++) {
        const at = n === steps ? pose.depth : START_MM + n * SAMPLE_STEP_MM;
        if (at < START_MM || (n === steps && at - last < 1e-9)) continue;
        const c = add(fulcrum, scale(d, at));
        const axis = level(c);
        let bone = axis >= boneLevel;
        let septum = crossed(c);
        for (let m = 0; m < 4 && !bone; m++) {
            const q = add(c, ring[m]);
            bone = level(q) >= boneLevel;
            septum = septum || crossed(q);
        }
        if (bone || septum) return { depth: Math.max(0, last), blocked: true, by: bone ? 'bone' : 'septum', contactMm: contact };
        if (axis >= softLevel) contact += SAMPLE_STEP_MM;
        last = at;
    }
    return { depth: pose.depth, blocked: false, by: null, contactMm: contact };
}

/* ---------------- the proximity HUD ---------------- */

/* One distance field (ct.json `sdf`): bytes on a regular grid, value * scale = mm to the structure's nearest
   surface (0 inside, the top value = clampMm or farther). Returns at(ras) -> mm (trilinear), clampMm outside the grid. */
export function sdfSampler(grid, bytes) {
    const [nx, ny, nz] = grid.dims;
    const A = grid.affine;
    const sx = A[0][0], sy = A[1][1], sz = A[2][2];
    const ox = A[0][3], oy = A[1][3], oz = A[2][3];
    const clampMm = grid.clampMm;
    const q = (i, j, k) => bytes[(k * ny + j) * nx + i] * grid.scale;
    return (p) => {
        const x = (p[0] - ox) / sx, y = (p[1] - oy) / sy, z = (p[2] - oz) / sz;
        if (!(x >= 0 && y >= 0 && z >= 0 && x <= nx - 1 && y <= ny - 1 && z <= nz - 1)) return clampMm;
        const i = Math.min(nx - 2, Math.floor(x)), j = Math.min(ny - 2, Math.floor(y)), k = Math.min(nz - 2, Math.floor(z));
        const fx = x - i, fy = y - j, fz = z - k;
        const lerp = (a, b, t) => a + (b - a) * t;
        const c00 = lerp(q(i, j, k), q(i + 1, j, k), fx), c10 = lerp(q(i, j + 1, k), q(i + 1, j + 1, k), fx);
        const c01 = lerp(q(i, j, k + 1), q(i + 1, j, k + 1), fx), c11 = lerp(q(i, j + 1, k + 1), q(i + 1, j + 1, k + 1), fx);
        return lerp(lerp(c00, c10, fy), lerp(c01, c11, fy), fz);
    };
}

/* [{ id, at(ras) -> mm }] and a point -> [{ id, mm }], nearest first. */
export function hudRows(fields, point) {
    return fields.map((f) => ({ id: f.id, mm: f.at(point) })).sort((a, b) => a.mm - b.mm);
}
