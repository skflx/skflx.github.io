/* =============================================================
   scope.js — the rigid endoscope's physics, in RAS mm (docs/ssb.md 3, 4).

   Pure arithmetic over plain arrays and the volume's typed arrays: no DOM,
   no three.js, so tools/test-ssb.mjs proves every rule here numerically in
   plain Node. mode-endoscope.js turns the result into a camera and a light.

   The scope pivots at the nostril. A pose is { d, yaw, pitch, roll, lens }
   on one side (state.js clamps it):
   - Shaft axis u from yaw (+ lateral, toward the nostril's own side) and
     pitch (+ superior); yaw = pitch = 0 is straight back (-A). The tip is
     fulcrum + d u, so with the fulcrum fixed every tip lies on the sphere of
     radius d around it (the pivot).
   - The camera head is held level: its up is the patient's superior
     projected off the shaft (headUp), its right headRight = u x headUp
     (patient left, looking back from the front).
   - The telescope rotates under the head. Roll rho is the clock angle of the
     lens's deflection on the head's face (0 = 12 o'clock, clockwise as the
     monitor shows it); the light post sits opposite, at rho + 180.
     The view is v = cos(alpha) u + sin(alpha) (cos(rho) headUp + sin(rho)
     headRight): exactly alpha from the shaft, toward rho.
   - The picture does not spin with the telescope: the image's up is headUp
     projected off v, so the image's horizontal is always perpendicular to
     the head's up (with a level shaft, perpendicular to the patient's
     superior: the horizon is level), and rolling an angled scope sweeps the
     view around the shaft instead of turning the picture.

   Collision: the shaft's centreline from the fulcrum to the tip, and a 2 mm
   sphere round the tip (a 4 mm telescope), may not pass tissue. The
   centreline (and so the tip itself) must stay in air: CT display value
   0 < v < AIR_MAX (about -480 HU through ct.json's toHU), or voxels a
   dissection removed (a wall unit's label plus the unlabelled voxels within
   1.5 mm of it, its mucosa; for an opened cell, the unlabelled voxels within
   2.5 mm of its air). The tip's 2 mm shell may press into soft tissue
   (mucosa is displaced, as a real scope does: on this bone-window,
   partial-volume scan the anterior airway is narrower than 4 mm of clear
   air) but never into bone (display >= BONE_MIN). The volume is defaced, so the vestibule is not in it:
   from the fulcrum to where the shaft first reaches air (the nostril and the
   masked face in front of the piriform aperture, plus the RIND mm of soft
   tissue the mask left at its edge) only bone blocks, and the shaft must stay on its own side of the
   midline; after that, the airway rules hold and no data blocks. A blocked move slides: the part of
   the tip's displacement that points into the wall (normal from the free
   space around the contact) is projected out, and what is left is taken as
   far as it stays free.

   tools/ssb-pipeline/uw/stations.py checks station poses with the same
   centreline rule and a stricter shell (all air), so a station that
   pipeline calls reachable loads here clear.
   ============================================================= */
import { LENSES, POSE_LIMITS, snapLens } from './state.js?v=00000000';

export const FOV_DEG = 75;          /* rigid 4 mm sinus telescopes are specified at about 70-80 deg (manufacturer data); 75 is the middle, and what stations.py renders its checks with */
export const TIP_RADIUS = 2;        /* mm: a 4 mm telescope */
export const AIR_MAX = 78;          /* display level: below it is air (about -480 HU) */
export const BONE_MIN = 150;        /* display level: bone (about +650 HU, the pipeline's rim threshold); the tip's shell may press into anything softer */
export const WALL_PAD = 1.5;        /* mm of unlabelled tissue (mucosa) a removed wall takes with it */
export const CELL_PAD = 2.5;        /* mm round an opened cell's air (partitions and mucosa) */
const RIND = 3;                     /* mm of soft tissue the mask left in front of the aperture that the shaft may cross before the airway */
const STEP = 0.5;                   /* mm between shaft samples (the CT voxel) */
const DEG = Math.PI / 180;

/* Used until ssb/geometry/endoscope.json exists: about 15 mm in front of
   the inferior half of the piriform aperture, which on this specimen is at
   roughly (+-7, -9, 6) (the first data in front of the airway; the face is
   masked). An inferred adult vestibule depth, not a measurement: the
   pipeline's own fulcrum replaces it. */
export const PROVISIONAL_FULCRUM = Object.freeze({ R: Object.freeze([7, 6, 6]), L: Object.freeze([-7, 6, 6]) });

/* ---------------- vectors ---------------- */

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => { const l = len(a); return l > 1e-12 ? scale(a, 1 / l) : [0, 0, 0]; };
const finite = (v) => typeof v === 'number' && Number.isFinite(v);
const isPoint = (p, lim = 400) => Array.isArray(p) && p.length === 3 && p.every((v) => finite(v) && Math.abs(v) <= lim);
export const vec = Object.freeze({ dot, add, scale, cross, len, unit });

const sign = (side) => (side === 'L' ? -1 : 1);
const SUP = [0, 0, 1];

/* ---------------- pose <-> frame ---------------- */

/* yaw, pitch (deg) on a side -> the shaft's unit axis. */
export function shaftDir(yaw, pitch, side) {
    const y = yaw * DEG;
    const p = pitch * DEG;
    return [sign(side) * Math.sin(y) * Math.cos(p), -Math.cos(y) * Math.cos(p), Math.sin(p)];
}

/* A shaft axis -> { yaw, pitch } (deg) on a side. */
export function anglesOf(u, side) {
    const n = unit(u);
    return { yaw: Math.atan2(sign(side) * n[0], -n[1]) / DEG, pitch: Math.asin(Math.max(-1, Math.min(1, n[2]))) / DEG };
}

/* The level camera head on a shaft: up = superior off the shaft, right = u x up. */
export function headFrame(u) {
    let up = add(SUP, u, -dot(SUP, u));
    if (len(up) < 1e-6) up = add([0, 1, 0], u, -u[1]);    /* a vertical shaft (outside the pose limits): anterior is up */
    up = unit(up);
    return { up, right: cross(u, up) };
}

/* Everything a pose means, in RAS: { u, tip, d, headUp, headRight, deflect,
   view, camUp, camRight, lightPost (clock deg), lens, roll }. */
export function scopeFrame(pose, fulcrum, side) {
    const u = shaftDir(pose.yaw, pose.pitch, side);
    const tip = add(fulcrum, u, pose.d);
    const { up: headUp, right: headRight } = headFrame(u);
    const r = pose.roll * DEG;
    const a = pose.lens * DEG;
    const deflect = add(scale(headUp, Math.cos(r)), headRight, Math.sin(r));
    const view = unit(add(scale(u, Math.cos(a)), deflect, Math.sin(a)));
    let camUp = add(headUp, view, -dot(headUp, view));
    camUp = len(camUp) > 1e-6 ? unit(camUp) : unit(add(scale(u, -1), view, dot(u, view)));
    const camRight = cross(view, camUp);
    const lightPost = ((pose.roll + 180) % 360 + 360) % 360;
    return { u, tip, d: pose.d, headUp, headRight, deflect, view, camUp, camRight, lightPost, lens: pose.lens, roll: pose.roll };
}

/* The clock angle (deg, clockwise from 12) of a RAS direction as the monitor
   shows it, for a frame; NaN for a direction along the view. */
export function screenAngle(frame, dir) {
    const x = dot(dir, frame.camRight);
    const y = dot(dir, frame.camUp);
    if (Math.hypot(x, y) < 1e-9) return NaN;
    return ((Math.atan2(x, y) / DEG) % 360 + 360) % 360;
}

/* The roll that turns a lens on shaft u toward `look`: the clock angle of
   look's component off the shaft, on the level head's face. */
export function rollFromLook(u, look) {
    const off = add(look, u, -dot(look, u));
    if (len(off) < 1e-6) return 0;
    const { up, right } = headFrame(u);
    return Math.atan2(dot(off, right), dot(off, up)) / DEG;
}

/* A pose -> its limits (not rounded: the store rounds what it shares). */
export function limitPose(p) {
    const c = (v, [lo, hi]) => Math.min(hi, Math.max(lo, v));
    let roll = ((p.roll % 360) + 360) % 360;
    if (roll > 180) roll -= 360;
    return { d: c(p.d, POSE_LIMITS.d), yaw: c(p.yaw, POSE_LIMITS.yaw), pitch: c(p.pitch, POSE_LIMITS.pitch), roll, lens: snapLens(p.lens) };
}

/* A tip point -> the pose that puts the tip there (roll and lens kept). */
export function poseFromTip(tip, fulcrum, side, keep = { roll: 0, lens: 0 }) {
    const v = add(tip, fulcrum, -1);
    const d = len(v);
    const { yaw, pitch } = d > 1e-9 ? anglesOf(v, side) : { yaw: 0, pitch: 0 };
    return limitPose({ d, yaw, pitch, roll: keep.roll, lens: keep.lens });
}

/* ---------------- data files ---------------- */

/* ssb/geometry/endoscope.json -> { fulcrum: { R, L }, method, airMax }, or
   null when it is absent or unusable (then PROVISIONAL_FULCRUM). */
export function parseEndoscope(doc) {
    if (!doc || typeof doc !== 'object' || !doc.fulcrum || typeof doc.fulcrum !== 'object') return null;
    const { R, L } = doc.fulcrum;
    if (!isPoint(R) || !isPoint(L)) return null;
    const c = doc.collision && typeof doc.collision === 'object' ? doc.collision : {};
    const air = [c.airMax, c.air_max, c.airBelow, Array.isArray(c.air) ? c.air[1] : undefined].find((v) => finite(v) && v > 1 && v < 255);
    return { fulcrum: { R: R.slice(), L: L.slice() }, method: typeof doc.method === 'string' ? doc.method : '', airMax: air || AIR_MAX };
}

const ID = /^[a-z]+\.[a-z0-9-]+$/;
const KEY = /^(t\.[a-z0-9-]+)\.(R|L|M)$/;

/* ssb/geometry/stations.json -> Map(key -> { key, id, side, tip, look, lens,
   roll, requires }) for the scope stations it holds (overviews, which have
   eye/target/up instead, are skipped). `has` limits ids to the graph. */
export function parseStations(doc, has = () => true) {
    const out = new Map();
    if (!doc || typeof doc !== 'object') return out;
    const src = doc.stations && typeof doc.stations === 'object' && !Array.isArray(doc.stations) ? doc.stations : doc;
    for (const [key, st] of Object.entries(src)) {
        const m = KEY.exec(key);
        if (!m || !has(m[1]) || !st || typeof st !== 'object' || !isPoint(st.tip) || !isPoint(st.look, 2)) continue;
        if (len(st.look) < 1e-6) continue;
        const requires = Array.isArray(st.requires) ? st.requires.filter((r) => typeof r === 'string' && ID.test(r)) : [];
        out.set(key, {
            key, id: m[1], side: m[2] === 'L' ? 'L' : 'R', tip: st.tip.slice(), look: unit(st.look),
            lens: finite(st.lens) ? snapLens(st.lens) : null, roll: finite(st.roll) ? st.roll : null, requires,
        });
    }
    return out;
}

/* ssb/geometry/stations.meta.json -> Map(key -> { reachable, note }). */
export function parseStationsMeta(doc) {
    const out = new Map();
    if (!doc || typeof doc !== 'object') return out;
    const src = doc.stations && typeof doc.stations === 'object' && !Array.isArray(doc.stations) ? doc.stations : doc;
    for (const [key, m] of Object.entries(src)) {
        if (!KEY.test(key) || !m || typeof m !== 'object') continue;
        const r = m.reachable;
        const reachable = !(r === false || r === 'no' || r === 0);
        const why = [m.blocked, m.reason, m.why, m.note].find((x) => typeof x === 'string' || (x && typeof x === 'object'));
        out.set(key, { reachable, note: why ? (typeof why === 'string' ? why : JSON.stringify(why)).slice(0, 200) : '' });
    }
    return out;
}

/* A station -> the pose that puts the tip at its tip and turns the lens
   toward its look (the roll is derived from `look`, so a difference in roll
   conventions cannot misaim it). */
export function poseFromStation(st, fulcrum, lensFallback = 0) {
    const lens = st.lens !== null ? st.lens : snapLens(lensFallback || 0);
    const v = add(st.tip, fulcrum, -1);
    const u = unit(v);
    const roll = lens > 0 ? rollFromLook(u, st.look) : (st.roll !== null ? st.roll : 0);
    return poseFromTip(st.tip, fulcrum, st.side, { roll, lens });
}

/* ---------------- collision ---------------- */

/* 26 unit directions (the cube's faces, edges and corners). */
const DIRS = (() => {
    const out = [];
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) if (x || y || z) out.push(unit([x, y, z]));
    return out;
})();

/* volume: volume.js's createVolume() (dims, ct, labels, toVoxel, describe,
   labelIndices). opts: { airMax, isCell(id) -> bool (an air cell or sinus:
   opened, not removed as a wall) }. */
export function createCollider(volume, { airMax = AIR_MAX, isCell = null } = {}) {
    const [nx, ny, nz] = volume.dims;
    const ct = volume.ct;
    const labels = volume.labels;
    const masks = new Map();        /* sorted requires -> Uint8Array | null */
    let removed = null;
    let removedKey = '';

    /* RAS -> voxel index (nearest), or -1 outside. */
    function indexAt(p) {
        const v = volume.toVoxel(p[0], p[1], p[2]);
        const i = Math.round(v[0]);
        const j = Math.round(v[1]);
        const k = Math.round(v[2]);
        if (i < 0 || j < 0 || k < 0 || i >= nx || j >= ny || k >= nz) return -1;
        return k * nx * ny + j * nx + i;
    }

    /* The voxels a set of removed ids frees (docs above). */
    function buildMask(ids) {
        if (!ids.length || !labels) return null;
        const want = new Map();     /* label index -> pad mm, negative for a cell (only the pad is freed) */
        for (const index of volume.labelIndices()) {
            const d = volume.describe(index);
            if (!d || !ids.includes(d.id)) continue;
            const cell = isCell ? isCell(d.id, index) : index <= 18;
            want.set(index, cell ? -CELL_PAD : WALL_PAD);
        }
        if (!want.size) return null;
        const mask = new Uint8Array(nx * ny * nz);
        const balls = new Map();
        const A = volume.affine;
        const ball = (r) => {
            if (balls.has(r)) return balls.get(r);
            const reach = [0, 1, 2].map((c) => Math.ceil(r / Math.min(...[0, 1, 2].map((n) => Math.abs(A[n][c]) || Infinity))));
            const out = [];
            for (let dk = -reach[2]; dk <= reach[2]; dk++) {
                for (let dj = -reach[1]; dj <= reach[1]; dj++) {
                    for (let di = -reach[0]; di <= reach[0]; di++) {
                        const mm = [0, 1, 2].map((n) => A[n][0] * di + A[n][1] * dj + A[n][2] * dk);
                        if (len(mm) <= r + 1e-9) out.push([di, dj, dk]);
                    }
                }
            }
            balls.set(r, out);
            return out;
        };
        for (let k = 0, n = 0; k < nz; k++) {
            for (let j = 0; j < ny; j++) {
                for (let i = 0; i < nx; i++, n++) {
                    const pad = want.get(labels[n]);
                    if (pad === undefined) continue;
                    if (pad > 0) mask[n] = 1;
                    for (const [di, dj, dk] of ball(Math.abs(pad))) {
                        const ii = i + di;
                        const jj = j + dj;
                        const kk = k + dk;
                        if (ii < 0 || jj < 0 || kk < 0 || ii >= nx || jj >= ny || kk >= nz) continue;
                        const t = kk * nx * ny + jj * nx + ii;
                        if (labels[t] === 0) mask[t] = 1;
                    }
                }
            }
        }
        return mask;
    }

    /* The dissection state: graph ids whose units are gone. */
    function setRemoved(ids = []) {
        const list = [...new Set((ids || []).filter((x) => typeof x === 'string'))].sort();
        const key = list.join('|');
        if (key === removedKey) return false;
        if (!masks.has(key)) masks.set(key, buildMask(list));
        removed = masks.get(key);
        removedKey = key;
        return true;
    }

    /* Is the voxel at index n air (or freed)? n < 0 is outside the volume. */
    const freeIndex = (n) => n >= 0 && ((removed && removed[n] === 1) || (ct[n] > 0 && ct[n] < airMax));

    /* The tip's shell: air, freed, or soft tissue it can push aside; never
       bone, no data, or outside. */
    const shellIndex = (n) => freeIndex(n) || (n >= 0 && ct[n] > 0 && ct[n] < BONE_MIN);

    /* What sits at a point, for messages: the label's name or tissue/bone. */
    function what(p) {
        const n = indexAt(p);
        if (n < 0) return 'outside the scan';
        const l = labels ? labels[n] : 0;
        const d = l ? volume.describe(l) : null;
        if (d) return d.name;
        return ct[n] === 0 ? 'no data' : ct[n] >= 150 ? 'bone' : 'soft tissue';
    }

    /* The first point that blocks a pose, or null when it is clear:
       { where: 'side' | 'shaft' | 'tip', point, s (mm from the fulcrum) }. */
    function check(pose, fulcrum, side) {
        const u = shaftDir(pose.yaw, pose.pitch, side);
        const d = Math.max(0, pose.d);
        const sg = sign(side);
        let entered = false;
        let data = -1;              /* mm along the shaft where it first met data */
        const steps = Math.max(1, Math.ceil(d / STEP));
        for (let n = 0; n <= steps; n++) {
            const s = Math.min(d, n * STEP);
            const p = add(fulcrum, u, s);
            const at = indexAt(p);
            if (!entered && !freeIndex(at)) {
                if (at >= 0 && ct[at] > 0 && data < 0) data = s;
                if (at >= 0 && (ct[at] >= BONE_MIN || (data >= 0 && s - data > RIND))) return { where: 'shaft', point: p, s };
                if (sg * p[0] < 0) return { where: 'side', point: p, s };
                continue;
            }
            entered = true;
            if (!freeIndex(at)) return { where: 'shaft', point: p, s };
        }
        const tip = add(fulcrum, u, d);
        for (const r of [TIP_RADIUS, TIP_RADIUS / 2]) {
            for (const dir of DIRS) {
                const p = add(tip, dir, r);
                const at = indexAt(p);
                if (!entered && !freeIndex(at) && !(at >= 0 && ct[at] >= BONE_MIN)) { if (sg * p[0] < 0) return { where: 'side', point: p, s: d }; continue; }
                if (!shellIndex(at)) return { where: 'tip', point: p, s: d };
            }
        }
        return null;
    }

    /* The wall's normal at a contact: away from the blocked samples around it. */
    function normalAt(p) {
        let n = [0, 0, 0];
        for (const r of [1, 2]) {
            for (const dir of DIRS) {
                const at = indexAt(add(p, dir, r));
                const free = at >= 0 && (ct[at] === 0 || freeIndex(at));
                n = add(n, dir, free ? 1 : -1);
            }
        }
        return len(n) > 1e-6 ? unit(n) : null;
    }

    /* Move from `from` toward `to` (both poses on `side`). A clear target is
       taken; a blocked one slides: the tip's displacement loses the part
       that points into the wall at the contact (for a contact on the shaft,
       the part of its sideways motion), up to three contacts deep, and what
       is left is taken as far as it stays clear. Roll and lens never collide
       (the telescope turns about its own axis). Returns { pose, blocked,
       slid, contact }. */
    function move(from, to, fulcrum, side) {
        const target = limitPose(to);
        const keep = { roll: target.roll, lens: target.lens };
        const first = check(target, fulcrum, side);
        if (!first) return { pose: target, blocked: false, slid: false, contact: null };
        const start = { ...limitPose(from), ...keep };
        if (check(start, fulcrum, side)) return { pose: start, blocked: true, slid: false, contact: first };
        const t0 = scopeFrame(start, fulcrum, side).tip;
        const u0 = shaftDir(start.yaw, start.pitch, side);
        let delta = add(scopeFrame(target, fulcrum, side).tip, t0, -1);
        const wanted = len(delta);
        let contact = first;
        for (let iter = 0; iter < 3 && contact; iter++) {
            const n = normalAt(contact.point);
            if (!n) break;
            if (contact.where === 'tip' || contact.where === 'side') {
                const dn = dot(delta, n);
                if (dn < 0) delta = add(delta, n, -dn);
            } else {
                let nl = add(n, u0, -dot(n, u0));
                if (len(nl) < 1e-6) break;
                nl = unit(nl);
                const lat = add(delta, u0, -dot(delta, u0));
                const ln = dot(lat, nl);
                if (ln < 0) delta = add(delta, nl, -ln);
            }
            const cand = poseFromTip(add(t0, delta), fulcrum, side, keep);
            contact = check(cand, fulcrum, side);
            if (!contact) return { pose: cand, blocked: true, slid: len(delta) > 1e-6 && len(delta) <= wanted + 1e-6, contact: first };
        }
        let lo = 0;
        let hi = 1;
        for (let n = 0; n < 12; n++) {
            const mid = (lo + hi) / 2;
            if (check(poseFromTip(add(t0, delta, mid), fulcrum, side, keep), fulcrum, side)) hi = mid; else lo = mid;
        }
        if (lo * len(delta) < 1e-3) return { pose: start, blocked: true, slid: false, contact: first };
        return { pose: poseFromTip(add(t0, delta, lo), fulcrum, side, keep), blocked: true, slid: true, contact: first };
    }

    /* A pose that may be blocked (a URL, a station without its dissection)
       -> the same pulled back along the shaft until it is clear, or null. */
    function retract(pose, fulcrum, side) {
        const p = limitPose(pose);
        for (let d = p.d; d >= 0; d -= STEP) {
            const q = { ...p, d };
            if (!check(q, fulcrum, side)) return q;
        }
        return null;
    }

    /* How deep the scope goes along yaw/pitch before anything stops it (mm),
       and how deep its shaft is when it first reaches air. */
    function freeDepth(yaw, pitch, fulcrum, side, max = POSE_LIMITS.d[1]) {
        const u = shaftDir(yaw, pitch, side);
        let entered = -1;
        for (let s = 0; s <= max; s += STEP) {
            const at = indexAt(add(fulcrum, u, s));
            if (freeIndex(at)) { entered = s; break; }
        }
        if (entered < 0) return { depth: 0, entered: -1 };
        let depth = 0;
        for (let d = entered; d <= max; d += 1) {
            if (check({ d, yaw, pitch, roll: 0, lens: 0 }, fulcrum, side)) break;
            depth = d;
        }
        return { depth, entered };
    }

    /* The starting pose on a side: the most open direction from the fulcrum
       (the nasal floor to the choana, on a normal nose), the tip 12 mm past
       where the shaft first reaches air. */
    function startPose(fulcrum, side) {
        let best = null;
        for (let pitch = -10; pitch <= 30; pitch += 2) {
            for (let yaw = -20; yaw <= 20; yaw += 2) {
                const f = freeDepth(yaw, pitch, fulcrum, side);
                if (f.entered >= 0 && (!best || f.depth > best.depth)) best = { yaw, pitch, ...f };
            }
        }
        if (!best || best.depth <= best.entered) return null;
        return { d: Math.min(best.depth, best.entered + 12), yaw: best.yaw, pitch: best.pitch, roll: 0, lens: 0 };
    }

    /* mm from p along dir to the first voxel that is not air (or `max`). */
    function distanceAhead(p, dir, max = 80) {
        for (let s = 0; s <= max; s += STEP) {
            const at = indexAt(add(p, dir, s));
            if (!freeIndex(at)) return s;
        }
        return max;
    }

    /* Is the straight path from `a` to within `near` mm of `b` all air? */
    function lineOfSight(a, b, near = 1.5) {
        const v = add(b, a, -1);
        const l = len(v);
        const dir = scale(v, 1 / (l || 1));
        for (let s = 0; s < l - near; s += STEP) if (!freeIndex(indexAt(add(a, dir, s)))) return false;
        return true;
    }

    return {
        check, move, retract, setRemoved, freeDepth, startPose, distanceAhead, lineOfSight, normalAt, what,
        free: (p) => freeIndex(indexAt(p)),
        get removed() { return removedKey ? removedKey.split('|') : []; },
        airMax,
    };
}

export { LENSES };
