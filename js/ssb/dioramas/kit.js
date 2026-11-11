/* =============================================================
   dioramas/kit.js — shared primitives for the parametric dioramas.

   A diorama is described as *solids* in RAS millimetres (docs/ssb.md 4);
   each solid kind has two readings that are written once, here, so the
   picture and any computation over it cannot disagree:
     - inside(solid, x, y, z)  the implicit test (frontal-recess voxelizes it)
     - geometry(THREE, solid)  the mesh (RAS mm; the diorama root converts
                               to the scene once, with rasToScene)
   Kinds:
     box    { min: [x,y,z], max: [x,y,z] }
     prism  a 2D polygon extruded along one axis: { axis: 'x'|'y'|'z',
            poly: [[u,v]…], holes?: [[[u,v]…]…], from, to }; the polygon's
            (u, v) are (y, z) for axis x, (x, z) for axis y, (x, y) for axis z
     super  superellipsoid |x/a|^n + |y/b|^n + |z/c|^n <= 1, centred at c,
            radii r, optionally tilted by `tilt` radians about the x axis
            (Wormald's building blocks, literally: n = 2 is an ellipsoid,
            larger n a rounded box); optional `zMin` truncates it below an
            absolute RAS height and `zMax` above one (untilted solids only)
     cyl    a straight capped cylinder { a: [x,y,z], b: [x,y,z], r } (canals,
            nerves, vessels that a rule has to test: tubeGeometry has no
            implicit test); optional `arc: { d: [x,y,z], half }` leaves only
            the wall on the side away from direction d, i.e. a gap of half
            angle `half` radians facing d (a dehiscence), mesh and test alike
   strip  { pts, wdir, w, t, seg? }  a thickened polyline (a ribbon: a cartilage plate, a flap); the
            section is a rectangle in the plane across its tangent, with an implicit test that
            needs the in-plane curvature below 0.5 / max width (stripInside throws past it)
   three.js is passed in (build(THREE, params)), never imported, so every
   diorama module stays loadable without WebGL — graph mode reads their
   PARAMS for the URL whitelist.
   ============================================================= */
import { rasToScene } from '../frame.js?v=f554e767';
import { isKind } from '../materials.js?v=34e04a58';

/* ---------------- implicit tests ---------------- */

export function pointInPoly(u, v, poly) {
    let hit = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [ui, vi] = poly[i];
        const [uj, vj] = poly[j];
        if ((vi > v) !== (vj > v) && u < ((uj - ui) * (v - vi)) / (vj - vi) + ui) hit = !hit;
    }
    return hit;
}

/* (u, v, w) of an RAS point for a prism along `axis`: w runs along the axis. */
function prismCoords(axis, x, y, z) {
    if (axis === 'x') return [y, z, x];
    if (axis === 'y') return [x, z, y];
    return [x, y, z];
}

export function inside(s, x, y, z) {
    if (s.kind === 'box') {
        return x >= s.min[0] && x <= s.max[0] && y >= s.min[1] && y <= s.max[1] && z >= s.min[2] && z <= s.max[2];
    }
    if (s.kind === 'prism') {
        const [u, v, w] = prismCoords(s.axis, x, y, z);
        if (w < Math.min(s.from, s.to) || w > Math.max(s.from, s.to)) return false;
        if (!pointInPoly(u, v, s.poly)) return false;
        return !(s.holes || []).some((h) => pointInPoly(u, v, h));
    }
    if (s.kind === 'cyl') return cylInside(s, x, y, z);
    if (s.kind === 'strip') return stripInside(s, x, y, z);
    if (s.kind === 'super') {
        if (s.zMin !== undefined && z < s.zMin) return false;
        if (s.zMax !== undefined && z > s.zMax) return false;
        let dx = x - s.c[0];
        let dy = y - s.c[1];
        let dz = z - s.c[2];
        if (s.tilt) {
            const cs = Math.cos(s.tilt);
            const sn = Math.sin(s.tilt);
            const ly = dy * cs + dz * sn;     /* inverse rotation about x */
            dz = -dy * sn + dz * cs;
            dy = ly;
        }
        const ax = Math.abs(dx / s.r[0]);
        const ay = Math.abs(dy / s.r[1]);
        const az = Math.abs(dz / s.r[2]);
        if (ax > 1 || ay > 1 || az > 1) return false;
        return ax ** s.n + ay ** s.n + az ** s.n <= 1;
    }
    return false;
}

/* Distance along and across the axis of a cylinder, for a point. */
export function cylFrame(s, x, y, z) {
    const ab = [s.b[0] - s.a[0], s.b[1] - s.a[1], s.b[2] - s.a[2]];
    const len = Math.hypot(...ab);
    const u = ab.map((v) => v / len);
    const ap = [x - s.a[0], y - s.a[1], z - s.a[2]];
    const t = ap[0] * u[0] + ap[1] * u[1] + ap[2] * u[2];
    const perp = [ap[0] - t * u[0], ap[1] - t * u[1], ap[2] - t * u[2]];
    return { t, len, u, perp, rho: Math.hypot(...perp) };
}

function cylInside(s, x, y, z) {
    const f = cylFrame(s, x, y, z);
    if (f.t < 0 || f.t > f.len || f.rho > s.r) return false;
    if (s.arc && f.rho > 1e-9) {
        const d = s.arc.d;
        const dl = Math.hypot(...d);
        const dp = d.map((v, i) => v / dl - f.u[i] * ((d[0] * f.u[0] + d[1] * f.u[1] + d[2] * f.u[2]) / dl));
        const dpl = Math.hypot(...dp) || 1;
        const cos = (f.perp[0] * dp[0] + f.perp[1] * dp[1] + f.perp[2] * dp[2]) / (f.rho * dpl);
        if (Math.acos(Math.max(-1, Math.min(1, cos))) < s.arc.half) return false;
    }
    return true;
}

/* Axis-aligned RAS bounds of a solid (for fast rejection). */
export function bounds(s) {
    if (s.kind === 'box') return { min: s.min.slice(), max: s.max.slice() };
    if (s.kind === 'strip') return stripBounds(s);
    if (s.kind === 'prism') {
        const us = s.poly.map((p) => p[0]);
        const vs = s.poly.map((p) => p[1]);
        const lo = [Math.min(...us), Math.min(...vs), Math.min(s.from, s.to)];
        const hi = [Math.max(...us), Math.max(...vs), Math.max(s.from, s.to)];
        const order = s.axis === 'x' ? [2, 0, 1] : s.axis === 'y' ? [0, 2, 1] : [0, 1, 2];
        return { min: order.map((i) => lo[i]), max: order.map((i) => hi[i]) };
    }
    if (s.kind === 'cyl') {
        const e = [0, 1, 2].map((i) => s.r * Math.sqrt(Math.max(0, 1 - ((s.b[i] - s.a[i]) / Math.hypot(...[0, 1, 2].map((j) => s.b[j] - s.a[j]))) ** 2)));
        return { min: [0, 1, 2].map((i) => Math.min(s.a[i], s.b[i]) - e[i]), max: [0, 1, 2].map((i) => Math.max(s.a[i], s.b[i]) + e[i]) };
    }
    const reach = s.tilt ? Math.hypot(s.r[1], s.r[2]) : null;
    const r = [s.r[0], reach || s.r[1], reach || s.r[2]];
    const b = { min: s.c.map((c, i) => c - r[i]), max: s.c.map((c, i) => c + r[i]) };
    if (s.zMin !== undefined) b.min[2] = Math.max(b.min[2], s.zMin);
    if (s.zMax !== undefined) b.max[2] = Math.min(b.max[2], s.zMax);
    return b;
}

/* ---------------- 2D profile helpers ---------------- */

/* A band of thickness t along a polyline (u, v), offset to the left of the
   direction of travel (side = +1) or to the right (side = -1), mitred. */
export function band(points, t, side = 1) {
    const off = [];
    for (let i = 0; i < points.length; i++) {
        const prev = points[Math.max(0, i - 1)];
        const next = points[Math.min(points.length - 1, i + 1)];
        const a = i > 0 ? norm2(sub2(points[i], prev)) : null;
        const b = i < points.length - 1 ? norm2(sub2(next, points[i])) : null;
        const n1 = a && [-a[1], a[0]];
        const n2 = b && [-b[1], b[0]];
        let n = n1 && n2 ? norm2([n1[0] + n2[0], n1[1] + n2[1]]) : (n1 || n2);
        const k = n1 && n2 ? 1 / Math.max(0.35, n[0] * n2[0] + n[1] * n2[1]) : 1;
        n = [n[0] * k * side * t, n[1] * k * side * t];
        off.push([points[i][0] + n[0], points[i][1] + n[1]]);
    }
    return [...points, ...off.reverse()];
}
const sub2 = (a, b) => [a[0] - b[0], a[1] - b[1]];
function norm2(a) {
    const l = Math.hypot(a[0], a[1]) || 1;
    return [a[0] / l, a[1] / l];
}

/* A closed superellipse (u, v) polygon. */
export function superellipse(cu, cv, ru, rv, n, seg = 48) {
    const e = 2 / n;
    const out = [];
    for (let i = 0; i < seg; i++) {
        const a = (i / seg) * Math.PI * 2;
        out.push([cu + ru * spow(Math.cos(a), e), cv + rv * spow(Math.sin(a), e)]);
    }
    return out;
}
const spow = (c, e) => Math.sign(c) * Math.abs(c) ** e;

/* ---------------- meshes (three.js passed in) ---------------- */

/* A group whose children are authored in RAS mm: its own transform is the
   one rasToScene conversion (a proper rotation, so winding survives). */
export function rasRoot(THREE) {
    const g = new THREE.Group();
    const col = (v) => new THREE.Vector3(...rasToScene(v));
    g.applyMatrix4(new THREE.Matrix4().makeBasis(col([1, 0, 0]), col([0, 1, 0]), col([0, 0, 1])));
    return g;
}

export function geometry(THREE, s, opts = {}) {
    if (s.kind === 'strip') return stripGeometry(THREE, s);
    if (s.kind === 'box') {
        const g = new THREE.BoxGeometry(s.max[0] - s.min[0], s.max[1] - s.min[1], s.max[2] - s.min[2]);
        g.translate((s.min[0] + s.max[0]) / 2, (s.min[1] + s.max[1]) / 2, (s.min[2] + s.max[2]) / 2);
        return g;
    }
    if (s.kind === 'prism') return prismGeometry(THREE, s);
    if (s.kind === 'cyl') return cylGeometry(THREE, s);
    return superGeometry(THREE, s, opts);
}

/* ExtrudeGeometry is built in (u, v, w) and mapped to RAS by a proper
   rotation. Its group 0 is the two caps — the cut faces of a slab, which
   the lab paints with the "bone cut" token — and group 1 the sides. */
function prismGeometry(THREE, s) {
    const shape = new THREE.Shape(s.poly.map(([u, v]) => new THREE.Vector2(u, v)));
    for (const h of s.holes || []) shape.holes.push(new THREE.Path(h.map(([u, v]) => new THREE.Vector2(u, v))));
    const lo = Math.min(s.from, s.to);
    const depth = Math.abs(s.to - s.from);
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 12 });
    const m = new THREE.Matrix4();
    if (s.axis === 'x') m.set(0, 0, 1, lo, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1);            /* (u,v,w) -> (w+lo, u, v) */
    else if (s.axis === 'y') m.set(1, 0, 0, 0, 0, 0, -1, lo + depth, 0, 1, 0, 0, 0, 0, 0, 1); /* -> (u, hi-w, v) */
    else m.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, lo, 0, 0, 0, 1);                            /* -> (u, v, w+lo) */
    g.applyMatrix4(m);
    return g;
}

/* A cylinder from a to b; with `arc`, an open C-shaped wall (double-sided in
   the lab) whose gap faces d. The reference direction of the arc is the
   projection of d on the plane across the axis, so the mesh and cylInside
   agree. */
function cylGeometry(THREE, s) {
    const a = new THREE.Vector3(...s.a);
    const b = new THREE.Vector3(...s.b);
    const len = a.distanceTo(b);
    const axis = b.clone().sub(a).normalize();
    const seg = 40;
    let g;
    let rot = 0;
    if (s.arc) {
        const half = s.arc.half;
        /* CylinderGeometry puts a vertex at (r sin t, r cos t); with the gap centred on t = 0 the wall runs from `half` round to 2 pi - `half` */
        g = new THREE.CylinderGeometry(s.r, s.r, len, seg, 1, true, half, Math.PI * 2 - 2 * half);
        const d = new THREE.Vector3(...s.arc.d).normalize();
        const dp = d.clone().sub(axis.clone().multiplyScalar(d.dot(axis))).normalize();
        /* where the cylinder's own +z falls, after aligning +y with the axis */
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
        const z0 = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
        const x0 = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
        /* rotate so the gap is centred on dp */
        const th = Math.atan2(dp.dot(x0), dp.dot(z0));
        rot = th;
        g.rotateY(rot);
        g.applyQuaternion(q);
    } else {
        g = new THREE.CylinderGeometry(s.r, s.r, len, seg, 1, false);
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis));
    }
    const mid = a.clone().add(b).multiplyScalar(0.5);
    g.translate(mid.x, mid.y, mid.z);
    return g;
}

/* Superellipsoid surface with analytic normals (no seam artefacts). */
function superGeometry(THREE, s, { segU = 40, segV = 24 } = {}) {
    const e = 2 / s.n;
    const [a, b, c] = s.r;
    const pos = [];
    const nor = [];
    const idx = [];
    /* truncated below zMin: start the latitude sweep at that height */
    let v0 = -Math.PI / 2;
    if (s.zMin !== undefined && s.zMin > s.c[2] - c) {
        const t = Math.max(-1, Math.min(1, (s.zMin - s.c[2]) / c));
        v0 = Math.asin(spow(t, 1 / e));
    }
    let v1 = Math.PI / 2;
    if (s.zMax !== undefined && s.zMax < s.c[2] + c) {
        const t = Math.max(-1, Math.min(1, (s.zMax - s.c[2]) / c));
        v1 = Math.asin(spow(t, 1 / e));
    }
    for (let j = 0; j <= segV; j++) {
        const v = v0 + (j / segV) * (v1 - v0);
        for (let i = 0; i <= segU; i++) {
            const u = -Math.PI + (i / segU) * Math.PI * 2;
            const x = a * spow(Math.cos(v), e) * spow(Math.cos(u), e);
            const y = b * spow(Math.cos(v), e) * spow(Math.sin(u), e);
            const z = c * spow(Math.sin(v), e);
            pos.push(x, y, z);
            const gx = Math.sign(x) * Math.abs(x / a) ** (s.n - 1) / a;
            const gy = Math.sign(y) * Math.abs(y / b) ** (s.n - 1) / b;
            const gz = Math.sign(z) * Math.abs(z / c) ** (s.n - 1) / c;
            const l = Math.hypot(gx, gy, gz) || 1;
            nor.push(gx / l, gy / l, gz / l);
        }
    }
    const row = segU + 1;
    for (let j = 0; j < segV; j++) {
        for (let i = 0; i < segU; i++) {
            const p = j * row + i;
            idx.push(p, p + 1, p + row, p + 1, p + row + 1, p + row);
        }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setIndex(idx);
    if (s.tilt) g.rotateX(s.tilt);
    g.translate(s.c[0], s.c[1], s.c[2]);
    return g;
}

/* A tube along RAS points (centripetal Catmull-Rom, docs/ssb.md 5.5). Each
   vertex also carries `ssbAxis`, the unit tangent there, so the fibrous
   materials (nerve, muscle) can run their grain lengthwise. */
export function tubeGeometry(THREE, points, radius, radial = 12) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
    const segs = Math.max(8, Math.round(curve.getLength() * 3));
    const g = new THREE.TubeGeometry(curve, segs, radius, radial, false);
    const axis = [];
    for (let i = 0; i <= segs; i++) {
        const t = curve.getTangentAt(i / segs);
        for (let j = 0; j <= radial; j++) axis.push(t.x, t.y, t.z);
    }
    g.setAttribute('ssbAxis', new THREE.Float32BufferAttribute(axis, 3));
    return g;
}

/* A vertical ribbon hanging below a polyline: top z per point, bottom z per point. */
export function ribbonGeometry(THREE, points, topZ, bottomZ) {
    const pos = [];
    const idx = [];
    points.forEach((p, i) => {
        pos.push(p[0], p[1], topZ[i], p[0], p[1], bottomZ[i]);
        if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
}

/* ---------------- parts ---------------- */

/* Name an object as a graph part: `<id>.<side>`, userData.id = the graph id
   (so a pick selects the entity). `look` tells the lab how to draw it:
   { kind, tint?, cut?, space?, ghost?, translucent?, doubleSide? } — `kind`
   is a tissue kind of materials.js (the graph's kind vocabulary: bone,
   mucosa, dura, artery, …); `tint` overrides the colour token only where a
   kind is categorical (air cells hue by identity); a diorama never names a
   colour. `hazards` lists the graph's hazard ids for a hazard site (hatched
   by the lab). An unknown kind is an authoring error and throws. */
export function tag(obj, id, side, look, extra = {}) {
    if (!look || !isKind(look.kind)) throw new Error(`diorama part ${id}.${side}: unknown material kind "${look && look.kind}"`);
    obj.name = `${id}.${side}`;
    obj.userData.id = id;
    obj.userData.side = side;
    obj.userData.look = look;
    Object.assign(obj.userData, extra);
    return obj;
}

export function mesh(THREE, geom, id, side, look, extra) {
    return tag(new THREE.Mesh(geom), id, side, look, extra);
}

/* ---------------- strip, distance transform, iso-surface (ST7b) ----------------
   Three DOM-free primitives for the nasal-framework spec (docs/ssb.md 6). None
   imports three.js: geometry takes THREE as the other builders do. */

const vAdd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const vSub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vScale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const vDot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vCross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const vLen = (a) => Math.hypot(a[0], a[1], a[2]);
const vLerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function vUnit(a, what) {
    const l = vLen(a);
    if (!(l > 1e-12)) throw new Error(`kit: ${what} is degenerate`);
    return vScale(a, 1 / l);
}

/* One value broadcast (a single [lo, hi] or [x, y, z]), or one per point. */
function perPoint(x, n, what) {
    if (Array.isArray(x) && typeof x[0] === 'number') return new Array(n).fill(x);
    if (Array.isArray(x) && x.length === n) return x;
    throw new Error(`kit.strip: ${what} must be one value or one per point (${n} points)`);
}

/* strip: { kind: 'strip', pts, wdir, w, t, seg? }
   pts    centreline, >= 2 RAS points
   wdir   width direction per point (or one vector); re-orthogonalized to the tangent
   w      [lo, hi] width offsets along the width direction, per point (or one pair)
   t      thickness, a number or per point
   seg    subdivisions per segment for the mesh (default 4)
   Frame: the tangent T at a point is the unit bisector of its adjacent segments
   (the end segment's direction at the ends); between points the frame is
   interpolated and re-orthogonalized, V = T x W. The cross-section is the
   rectangle lo <= u <= hi, |v| <= t/2. Solids are not mutated after first use
   (the frame is cached per solid). */
const STRIP_MODEL = new WeakMap();
function stripModel(s) {
    if (STRIP_MODEL.has(s)) return STRIP_MODEL.get(s);
    const P = s.pts;
    if (!Array.isArray(P) || P.length < 2) throw new Error('kit.strip: needs at least two points');
    const n = P.length;
    const D = [];
    const L = [];
    for (let j = 0; j < n - 1; j++) {
        const d = vSub(P[j + 1], P[j]);
        L.push(vLen(d));
        D.push(vUnit(d, `strip segment ${j}`));
    }
    const T = P.map((_, i) => vUnit(vAdd(D[Math.max(0, i - 1)], D[Math.min(n - 2, i)]), `strip tangent at point ${i}`));
    const WD = perPoint(s.wdir, n, 'wdir');
    const LOHI = perPoint(s.w, n, 'w');
    const TH = typeof s.t === 'number' ? new Array(n).fill(s.t) : perPoint(s.t, n, 't');
    const W = WD.map((w, i) => vUnit(vSub(w, vScale(T[i], vDot(w, T[i]))), `strip width direction at point ${i}`));
    for (let i = 0; i < n; i++) {
        if (!(LOHI[i][0] < LOHI[i][1])) throw new Error(`kit.strip: point ${i} needs lo < hi`);
        if (!(TH[i] > 0)) throw new Error(`kit.strip: point ${i} needs t > 0`);
    }
    /* The nearest-point frame is unique only while the strip bends about its width axis: an in-plane
       curvature (about V, the thickness axis, not about W) must keep |κ_w| · max(|lo|, |hi|) <= 0.5. */
    for (let i = 1; i < n - 1; i++) {
        const kw = vDot(vScale(vSub(D[i], D[i - 1]), 2 / (L[i - 1] + L[i])), W[i]);
        const m = Math.max(Math.abs(LOHI[i][0]), Math.abs(LOHI[i][1]));
        if (Math.abs(kw) * m > 0.5) {
            throw new Error(`kit.strip: point ${i} bends in its own plane (|κ_w| · max|w| = ${(Math.abs(kw) * m).toFixed(3)} > 0.5); a strip may bend only about its width axis`);
        }
    }
    const model = { P, n, D, L, T, W, LOHI, TH };
    STRIP_MODEL.set(s, model);
    return model;
}

/* The frame at parameter s in [0, 1] of segment j. */
function stripFrame(M, j, s) {
    const C = vAdd(M.P[j], vScale(M.D[j], s * M.L[j]));
    const T = vUnit(vLerp(M.T[j], M.T[j + 1], s), 'strip tangent');
    const Wl = vLerp(M.W[j], M.W[j + 1], s);
    const W = vUnit(vSub(Wl, vScale(T, vDot(Wl, T))), 'strip width');
    const lo = M.LOHI[j][0] + (M.LOHI[j + 1][0] - M.LOHI[j][0]) * s;
    const hi = M.LOHI[j][1] + (M.LOHI[j + 1][1] - M.LOHI[j][1]) * s;
    const t = M.TH[j] + (M.TH[j + 1] - M.TH[j]) * s;
    return { C, T, W, V: vCross(T, W), lo, hi, t };
}

function stripInside(s, x, y, z) {
    const M = stripModel(s);
    const p = [x, y, z];
    let best = Infinity;
    let bj = 0;
    let bs = 0;
    let bt = 0;
    for (let j = 0; j < M.n - 1; j++) {
        const tr = vDot(vSub(p, M.P[j]), M.D[j]) / M.L[j];
        const sc = Math.min(1, Math.max(0, tr));
        const q = vAdd(M.P[j], vScale(M.D[j], sc * M.L[j]));
        const d2 = vDot(vSub(p, q), vSub(p, q));
        if (d2 < best) { best = d2; bj = j; bs = sc; bt = tr; }
    }
    /* the projection lies on the polyline: a foot beyond an end cap is outside the strip */
    if ((bj === 0 && bt < 0) || (bj === M.n - 2 && bt > 1)) return false;
    const F = stripFrame(M, bj, bs);
    const d = vSub(p, F.C);
    const u = vDot(d, F.W);
    const v = vDot(d, F.V);
    return u >= F.lo && u <= F.hi && Math.abs(v) <= F.t / 2;
}

/* The cross-section frames the mesh is built from: `seg` per segment, plus the last point. */
function stripSections(M, seg) {
    const out = [];
    for (let j = 0; j < M.n - 1; j++) for (let k = 0; k < seg; k++) out.push(stripFrame(M, j, k / seg));
    out.push(stripFrame(M, M.n - 2, 1));
    return out;
}

/* The four corners of a section, in order around the rectangle. */
function stripCorners(f) {
    const h = f.t / 2;
    return [[f.lo, -h], [f.hi, -h], [f.hi, h], [f.lo, h]].map(([u, v]) => vAdd(f.C, vAdd(vScale(f.W, u), vScale(f.V, v))));
}

function stripBounds(s) {
    const M = stripModel(s);
    const pts = stripSections(M, s.seg || 4).flatMap(stripCorners);
    const min = [0, 1, 2].map((i) => pts.reduce((a, p) => Math.min(a, p[i]), Infinity));
    const max = [0, 1, 2].map((i) => pts.reduce((a, p) => Math.max(a, p[i]), -Infinity));
    return { min, max };
}

/* Outward normal of side i of a section (corner i to i+1): bottom -V, hi +W, top +V, lo -W. */
const stripSideNormal = (f, i) => [vScale(f.V, -1), f.W, f.V, vScale(f.W, -1)][i];

function stripGeometry(THREE, s) {
    const M = stripModel(s);
    const secs = stripSections(M, s.seg || 4);
    const cs = secs.map(stripCorners);
    const pos = [];
    const nor = [];
    /* one triangle, flat-shaded with the face normal n; wound to agree with n */
    const tri = (a, b, c, n) => {
        const flip = vDot(vCross(vSub(b, a), vSub(c, a)), n) < 0;
        for (const p of flip ? [a, c, b] : [a, b, c]) {
            pos.push(p[0], p[1], p[2]);
            nor.push(n[0], n[1], n[2]);
        }
    };
    for (let k = 0; k + 1 < secs.length; k++) {
        for (let i = 0; i < 4; i++) {
            const n = stripSideNormal(secs[k], i);
            const a0 = cs[k][i];
            const a1 = cs[k][(i + 1) % 4];
            const b0 = cs[k + 1][i];
            const b1 = cs[k + 1][(i + 1) % 4];
            tri(a0, a1, b1, n);
            tri(a0, b1, b0, n);
        }
    }
    const cap = (c, n) => { tri(c[0], c[1], c[2], n); tri(c[0], c[2], c[3], n); };
    cap(cs[0], vScale(secs[0].T, -1));
    cap(cs[cs.length - 1], secs[secs.length - 1].T);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    return g;
}

/* ---- exact Euclidean distance transform (separable; Felzenszwalb & Huttenlocher 2012) ---- */

/* One line: squared distance to the lower envelope of the parabolas (q - p)^2 + f[p].
   f holds squared distances in voxel units (Infinity where nothing is set); v, z are scratch. */
function edtLine(f, d, n, v, z) {
    let k = -1;
    for (let q = 0; q < n; q++) {
        if (!(f[q] < Infinity)) continue;
        let s = 0;
        while (k >= 0) {
            s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
            if (s > z[k]) break;
            k--;
        }
        if (k < 0) { k = 0; v[0] = q; z[0] = -Infinity; } else { k++; v[k] = q; z[k] = s; }
        z[k + 1] = Infinity;
    }
    if (k < 0) { d.fill(Infinity, 0, n); return; }
    k = 0;
    for (let q = 0; q < n; q++) {
        while (z[k + 1] < q) k++;
        d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
    }
}

/* Distance in mm from every voxel to the nearest set voxel (0 on it). mask[(z * ny + y) * nx + x]
   is set for the voxels that count; the result is a Float32Array in the same order (Infinity when
   the mask is empty). Exact: separable 1-D passes along x, y, z, each a lower envelope of parabolas. */
export function edt(mask, nx, ny, nz, step) {
    const N = nx * ny * nz;
    const f = new Float64Array(N);
    for (let i = 0; i < N; i++) f[i] = mask[i] ? 0 : Infinity;
    const Lmax = Math.max(nx, ny, nz);
    const buf = new Float64Array(Lmax);
    const out = new Float64Array(Lmax);
    const v = new Int32Array(Lmax);
    const z = new Float64Array(Lmax + 1);
    const pass = (count, stride, starts) => {
        for (const st of starts) {
            for (let i = 0; i < count; i++) buf[i] = f[st + i * stride];
            edtLine(buf, out, count, v, z);
            for (let i = 0; i < count; i++) f[st + i * stride] = out[i];
        }
    };
    const xs = []; for (let zz = 0; zz < nz; zz++) for (let yy = 0; yy < ny; yy++) xs.push((zz * ny + yy) * nx);
    pass(nx, 1, xs);
    const ys = []; for (let zz = 0; zz < nz; zz++) for (let xx = 0; xx < nx; xx++) ys.push(zz * ny * nx + xx);
    pass(ny, nx, ys);
    const zs = []; for (let yy = 0; yy < ny; yy++) for (let xx = 0; xx < nx; xx++) zs.push(yy * nx + xx);
    pass(nz, nx * ny, zs);
    const res = new Float32Array(N);
    for (let i = 0; i < N; i++) res[i] = f[i] === Infinity ? Infinity : Math.sqrt(f[i]) * step;
    return res;
}

/* ---- iso-surface: marching cubes ----
   Corner c sits at MC_CORNER[c] and edge e joins the corners in MC_EDGE[e]: A corner is inside when field < level. MC_TRI[case] lists the triangles of a cube as edge
   triples (up to five, -1 padded). The rows are generated, not copied: a saddle face connects its inside
   corners, a rule that depends only on the face's four corners, so neighbouring cells always agree and
   the mesh is closed (kit tests check every row and the closed sphere). The crossed edges of a row are
   exactly the sign changes of its case (tested for all 256). */
const MC_CORNER = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
const MC_EDGE = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
const MC_TRI = [
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 0
    [0, 3, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 1
    [1, 0, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 2
    [1, 3, 8, 1, 8, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 3
    [2, 1, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 4
    [0, 1, 10, 0, 10, 2, 0, 2, 3, 0, 3, 8, -1, -1, -1], // 5
    [2, 0, 9, 2, 9, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 6
    [2, 3, 8, 2, 8, 9, 2, 9, 10, -1, -1, -1, -1, -1, -1], // 7
    [3, 2, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 8
    [0, 2, 11, 0, 11, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 9
    [3, 0, 9, 3, 9, 1, 3, 1, 2, 3, 2, 11, -1, -1, -1], // 10
    [1, 2, 11, 1, 11, 8, 1, 8, 9, -1, -1, -1, -1, -1, -1], // 11
    [3, 1, 10, 3, 10, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 12
    [0, 1, 10, 0, 10, 11, 0, 11, 8, -1, -1, -1, -1, -1, -1], // 13
    [3, 0, 9, 3, 9, 10, 3, 10, 11, -1, -1, -1, -1, -1, -1], // 14
    [8, 9, 10, 8, 10, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 15
    [7, 4, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 16
    [0, 3, 7, 0, 7, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 17
    [1, 0, 8, 1, 8, 7, 1, 7, 4, 1, 4, 9, -1, -1, -1], // 18
    [1, 3, 7, 1, 7, 4, 1, 4, 9, -1, -1, -1, -1, -1, -1], // 19
    [2, 1, 10, 7, 4, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 20
    [0, 1, 10, 0, 10, 2, 0, 2, 3, 0, 3, 7, 0, 7, 4], // 21
    [2, 0, 8, 2, 8, 7, 2, 7, 4, 2, 4, 9, 2, 9, 10], // 22
    [2, 3, 7, 2, 7, 4, 2, 4, 9, 2, 9, 10, -1, -1, -1], // 23
    [3, 2, 11, 3, 11, 7, 3, 7, 4, 3, 4, 8, -1, -1, -1], // 24
    [0, 2, 11, 0, 11, 7, 0, 7, 4, -1, -1, -1, -1, -1, -1], // 25
    [3, 0, 8, 1, 2, 11, 1, 11, 7, 1, 7, 4, 1, 4, 9], // 26
    [1, 2, 11, 1, 11, 7, 1, 7, 4, 1, 4, 9, -1, -1, -1], // 27
    [3, 1, 10, 3, 10, 11, 3, 11, 7, 3, 7, 4, 3, 4, 8], // 28
    [0, 1, 10, 0, 10, 11, 0, 11, 7, 0, 7, 4, -1, -1, -1], // 29
    [3, 0, 8, 7, 4, 9, 7, 9, 10, 7, 10, 11, -1, -1, -1], // 30
    [7, 4, 9, 7, 9, 10, 7, 10, 11, -1, -1, -1, -1, -1, -1], // 31
    [4, 5, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 32
    [0, 3, 8, 0, 8, 4, 0, 4, 5, 0, 5, 9, -1, -1, -1], // 33
    [1, 0, 4, 1, 4, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 34
    [1, 3, 8, 1, 8, 4, 1, 4, 5, -1, -1, -1, -1, -1, -1], // 35
    [2, 1, 9, 2, 9, 4, 2, 4, 5, 2, 5, 10, -1, -1, -1], // 36
    [0, 1, 9, 2, 3, 8, 2, 8, 4, 2, 4, 5, 2, 5, 10], // 37
    [2, 0, 4, 2, 4, 5, 2, 5, 10, -1, -1, -1, -1, -1, -1], // 38
    [2, 3, 8, 2, 8, 4, 2, 4, 5, 2, 5, 10, -1, -1, -1], // 39
    [3, 2, 11, 4, 5, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 40
    [0, 2, 11, 0, 11, 8, 0, 8, 4, 0, 4, 5, 0, 5, 9], // 41
    [3, 0, 4, 3, 4, 5, 3, 5, 1, 3, 1, 2, 3, 2, 11], // 42
    [1, 2, 11, 1, 11, 8, 1, 8, 4, 1, 4, 5, -1, -1, -1], // 43
    [3, 1, 9, 3, 9, 4, 3, 4, 5, 3, 5, 10, 3, 10, 11], // 44
    [0, 1, 9, 4, 5, 10, 4, 10, 11, 4, 11, 8, -1, -1, -1], // 45
    [3, 0, 4, 3, 4, 5, 3, 5, 10, 3, 10, 11, -1, -1, -1], // 46
    [4, 5, 10, 4, 10, 11, 4, 11, 8, -1, -1, -1, -1, -1, -1], // 47
    [7, 5, 9, 7, 9, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 48
    [0, 3, 7, 0, 7, 5, 0, 5, 9, -1, -1, -1, -1, -1, -1], // 49
    [1, 0, 8, 1, 8, 7, 1, 7, 5, -1, -1, -1, -1, -1, -1], // 50
    [1, 3, 7, 1, 7, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 51
    [2, 1, 9, 2, 9, 8, 2, 8, 7, 2, 7, 5, 2, 5, 10], // 52
    [0, 1, 9, 2, 3, 7, 2, 7, 5, 2, 5, 10, -1, -1, -1], // 53
    [2, 0, 8, 2, 8, 7, 2, 7, 5, 2, 5, 10, -1, -1, -1], // 54
    [2, 3, 7, 2, 7, 5, 2, 5, 10, -1, -1, -1, -1, -1, -1], // 55
    [3, 2, 11, 3, 11, 7, 3, 7, 5, 3, 5, 9, 3, 9, 8], // 56
    [0, 2, 11, 0, 11, 7, 0, 7, 5, 0, 5, 9, -1, -1, -1], // 57
    [3, 0, 8, 1, 2, 11, 1, 11, 7, 1, 7, 5, -1, -1, -1], // 58
    [1, 2, 11, 1, 11, 7, 1, 7, 5, -1, -1, -1, -1, -1, -1], // 59
    [3, 1, 9, 3, 9, 8, 7, 5, 10, 7, 10, 11, -1, -1, -1], // 60
    [0, 1, 9, 7, 5, 10, 7, 10, 11, -1, -1, -1, -1, -1, -1], // 61
    [3, 0, 8, 7, 5, 10, 7, 10, 11, -1, -1, -1, -1, -1, -1], // 62
    [7, 5, 10, 7, 10, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 63
    [5, 6, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 64
    [0, 3, 8, 5, 6, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 65
    [1, 0, 9, 1, 9, 5, 1, 5, 6, 1, 6, 10, -1, -1, -1], // 66
    [1, 3, 8, 1, 8, 9, 1, 9, 5, 1, 5, 6, 1, 6, 10], // 67
    [2, 1, 5, 2, 5, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 68
    [0, 1, 5, 0, 5, 6, 0, 6, 2, 0, 2, 3, 0, 3, 8], // 69
    [2, 0, 9, 2, 9, 5, 2, 5, 6, -1, -1, -1, -1, -1, -1], // 70
    [2, 3, 8, 2, 8, 9, 2, 9, 5, 2, 5, 6, -1, -1, -1], // 71
    [3, 2, 10, 3, 10, 5, 3, 5, 6, 3, 6, 11, -1, -1, -1], // 72
    [0, 2, 10, 0, 10, 5, 0, 5, 6, 0, 6, 11, 0, 11, 8], // 73
    [3, 0, 9, 3, 9, 5, 3, 5, 6, 3, 6, 11, 1, 2, 10], // 74
    [1, 2, 10, 5, 6, 11, 5, 11, 8, 5, 8, 9, -1, -1, -1], // 75
    [3, 1, 5, 3, 5, 6, 3, 6, 11, -1, -1, -1, -1, -1, -1], // 76
    [0, 1, 5, 0, 5, 6, 0, 6, 11, 0, 11, 8, -1, -1, -1], // 77
    [3, 0, 9, 3, 9, 5, 3, 5, 6, 3, 6, 11, -1, -1, -1], // 78
    [5, 6, 11, 5, 11, 8, 5, 8, 9, -1, -1, -1, -1, -1, -1], // 79
    [5, 4, 8, 5, 8, 7, 5, 7, 6, 5, 6, 10, -1, -1, -1], // 80
    [0, 3, 7, 0, 7, 6, 0, 6, 10, 0, 10, 5, 0, 5, 4], // 81
    [1, 0, 8, 1, 8, 7, 1, 7, 6, 1, 6, 10, 5, 4, 9], // 82
    [1, 3, 7, 1, 7, 6, 1, 6, 10, 5, 4, 9, -1, -1, -1], // 83
    [2, 1, 5, 2, 5, 4, 2, 4, 8, 2, 8, 7, 2, 7, 6], // 84
    [0, 1, 5, 0, 5, 4, 2, 3, 7, 2, 7, 6, -1, -1, -1], // 85
    [2, 0, 8, 2, 8, 7, 2, 7, 6, 5, 4, 9, -1, -1, -1], // 86
    [2, 3, 7, 2, 7, 6, 5, 4, 9, -1, -1, -1, -1, -1, -1], // 87
    [3, 2, 10, 3, 10, 5, 3, 5, 4, 3, 4, 8, 7, 6, 11], // 88
    [0, 2, 10, 0, 10, 5, 0, 5, 4, 7, 6, 11, -1, -1, -1], // 89
    [3, 0, 8, 1, 2, 10, 5, 4, 9, 7, 6, 11, -1, -1, -1], // 90
    [1, 2, 10, 5, 4, 9, 7, 6, 11, -1, -1, -1, -1, -1, -1], // 91
    [3, 1, 5, 3, 5, 4, 3, 4, 8, 7, 6, 11, -1, -1, -1], // 92
    [0, 1, 5, 0, 5, 4, 7, 6, 11, -1, -1, -1, -1, -1, -1], // 93
    [3, 0, 8, 5, 4, 9, 7, 6, 11, -1, -1, -1, -1, -1, -1], // 94
    [5, 4, 9, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 95
    [4, 6, 10, 4, 10, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 96
    [0, 3, 8, 0, 8, 4, 0, 4, 6, 0, 6, 10, 0, 10, 9], // 97
    [1, 0, 4, 1, 4, 6, 1, 6, 10, -1, -1, -1, -1, -1, -1], // 98
    [1, 3, 8, 1, 8, 4, 1, 4, 6, 1, 6, 10, -1, -1, -1], // 99
    [2, 1, 9, 2, 9, 4, 2, 4, 6, -1, -1, -1, -1, -1, -1], // 100
    [0, 1, 9, 2, 3, 8, 2, 8, 4, 2, 4, 6, -1, -1, -1], // 101
    [2, 0, 4, 2, 4, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 102
    [2, 3, 8, 2, 8, 4, 2, 4, 6, -1, -1, -1, -1, -1, -1], // 103
    [3, 2, 10, 3, 10, 9, 3, 9, 4, 3, 4, 6, 3, 6, 11], // 104
    [0, 2, 10, 0, 10, 9, 4, 6, 11, 4, 11, 8, -1, -1, -1], // 105
    [3, 0, 4, 3, 4, 6, 3, 6, 11, 1, 2, 10, -1, -1, -1], // 106
    [1, 2, 10, 4, 6, 11, 4, 11, 8, -1, -1, -1, -1, -1, -1], // 107
    [3, 1, 9, 3, 9, 4, 3, 4, 6, 3, 6, 11, -1, -1, -1], // 108
    [0, 1, 9, 4, 6, 11, 4, 11, 8, -1, -1, -1, -1, -1, -1], // 109
    [3, 0, 4, 3, 4, 6, 3, 6, 11, -1, -1, -1, -1, -1, -1], // 110
    [4, 6, 11, 4, 11, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 111
    [7, 6, 10, 7, 10, 9, 7, 9, 8, -1, -1, -1, -1, -1, -1], // 112
    [0, 3, 7, 0, 7, 6, 0, 6, 10, 0, 10, 9, -1, -1, -1], // 113
    [1, 0, 8, 1, 8, 7, 1, 7, 6, 1, 6, 10, -1, -1, -1], // 114
    [1, 3, 7, 1, 7, 6, 1, 6, 10, -1, -1, -1, -1, -1, -1], // 115
    [2, 1, 9, 2, 9, 8, 2, 8, 7, 2, 7, 6, -1, -1, -1], // 116
    [0, 1, 9, 2, 3, 7, 2, 7, 6, -1, -1, -1, -1, -1, -1], // 117
    [2, 0, 8, 2, 8, 7, 2, 7, 6, -1, -1, -1, -1, -1, -1], // 118
    [2, 3, 7, 2, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 119
    [3, 2, 10, 3, 10, 9, 3, 9, 8, 7, 6, 11, -1, -1, -1], // 120
    [0, 2, 10, 0, 10, 9, 7, 6, 11, -1, -1, -1, -1, -1, -1], // 121
    [3, 0, 8, 1, 2, 10, 7, 6, 11, -1, -1, -1, -1, -1, -1], // 122
    [1, 2, 10, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 123
    [3, 1, 9, 3, 9, 8, 7, 6, 11, -1, -1, -1, -1, -1, -1], // 124
    [0, 1, 9, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 125
    [3, 0, 8, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 126
    [7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 127
    [6, 7, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 128
    [0, 3, 11, 0, 11, 6, 0, 6, 7, 0, 7, 8, -1, -1, -1], // 129
    [1, 0, 9, 6, 7, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 130
    [1, 3, 11, 1, 11, 6, 1, 6, 7, 1, 7, 8, 1, 8, 9], // 131
    [2, 1, 10, 2, 10, 6, 2, 6, 7, 2, 7, 11, -1, -1, -1], // 132
    [0, 1, 10, 0, 10, 6, 0, 6, 7, 0, 7, 8, 2, 3, 11], // 133
    [2, 0, 9, 2, 9, 10, 2, 10, 6, 2, 6, 7, 2, 7, 11], // 134
    [2, 3, 11, 6, 7, 8, 6, 8, 9, 6, 9, 10, -1, -1, -1], // 135
    [3, 2, 6, 3, 6, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 136
    [0, 2, 6, 0, 6, 7, 0, 7, 8, -1, -1, -1, -1, -1, -1], // 137
    [3, 0, 9, 3, 9, 1, 3, 1, 2, 3, 2, 6, 3, 6, 7], // 138
    [1, 2, 6, 1, 6, 7, 1, 7, 8, 1, 8, 9, -1, -1, -1], // 139
    [3, 1, 10, 3, 10, 6, 3, 6, 7, -1, -1, -1, -1, -1, -1], // 140
    [0, 1, 10, 0, 10, 6, 0, 6, 7, 0, 7, 8, -1, -1, -1], // 141
    [3, 0, 9, 3, 9, 10, 3, 10, 6, 3, 6, 7, -1, -1, -1], // 142
    [6, 7, 8, 6, 8, 9, 6, 9, 10, -1, -1, -1, -1, -1, -1], // 143
    [6, 4, 8, 6, 8, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 144
    [0, 3, 11, 0, 11, 6, 0, 6, 4, -1, -1, -1, -1, -1, -1], // 145
    [1, 0, 8, 1, 8, 11, 1, 11, 6, 1, 6, 4, 1, 4, 9], // 146
    [1, 3, 11, 1, 11, 6, 1, 6, 4, 1, 4, 9, -1, -1, -1], // 147
    [2, 1, 10, 2, 10, 6, 2, 6, 4, 2, 4, 8, 2, 8, 11], // 148
    [0, 1, 10, 0, 10, 6, 0, 6, 4, 2, 3, 11, -1, -1, -1], // 149
    [2, 0, 8, 2, 8, 11, 6, 4, 9, 6, 9, 10, -1, -1, -1], // 150
    [2, 3, 11, 6, 4, 9, 6, 9, 10, -1, -1, -1, -1, -1, -1], // 151
    [3, 2, 6, 3, 6, 4, 3, 4, 8, -1, -1, -1, -1, -1, -1], // 152
    [0, 2, 6, 0, 6, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 153
    [3, 0, 8, 1, 2, 6, 1, 6, 4, 1, 4, 9, -1, -1, -1], // 154
    [1, 2, 6, 1, 6, 4, 1, 4, 9, -1, -1, -1, -1, -1, -1], // 155
    [3, 1, 10, 3, 10, 6, 3, 6, 4, 3, 4, 8, -1, -1, -1], // 156
    [0, 1, 10, 0, 10, 6, 0, 6, 4, -1, -1, -1, -1, -1, -1], // 157
    [3, 0, 8, 6, 4, 9, 6, 9, 10, -1, -1, -1, -1, -1, -1], // 158
    [6, 4, 9, 6, 9, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 159
    [4, 7, 11, 4, 11, 6, 4, 6, 5, 4, 5, 9, -1, -1, -1], // 160
    [0, 3, 11, 0, 11, 6, 0, 6, 5, 0, 5, 9, 4, 7, 8], // 161
    [1, 0, 4, 1, 4, 7, 1, 7, 11, 1, 11, 6, 1, 6, 5], // 162
    [1, 3, 11, 1, 11, 6, 1, 6, 5, 4, 7, 8, -1, -1, -1], // 163
    [2, 1, 9, 2, 9, 4, 2, 4, 7, 2, 7, 11, 6, 5, 10], // 164
    [0, 1, 9, 2, 3, 11, 4, 7, 8, 6, 5, 10, -1, -1, -1], // 165
    [2, 0, 4, 2, 4, 7, 2, 7, 11, 6, 5, 10, -1, -1, -1], // 166
    [2, 3, 11, 4, 7, 8, 6, 5, 10, -1, -1, -1, -1, -1, -1], // 167
    [3, 2, 6, 3, 6, 5, 3, 5, 9, 3, 9, 4, 3, 4, 7], // 168
    [0, 2, 6, 0, 6, 5, 0, 5, 9, 4, 7, 8, -1, -1, -1], // 169
    [3, 0, 4, 3, 4, 7, 1, 2, 6, 1, 6, 5, -1, -1, -1], // 170
    [1, 2, 6, 1, 6, 5, 4, 7, 8, -1, -1, -1, -1, -1, -1], // 171
    [3, 1, 9, 3, 9, 4, 3, 4, 7, 6, 5, 10, -1, -1, -1], // 172
    [0, 1, 9, 4, 7, 8, 6, 5, 10, -1, -1, -1, -1, -1, -1], // 173
    [3, 0, 4, 3, 4, 7, 6, 5, 10, -1, -1, -1, -1, -1, -1], // 174
    [4, 7, 8, 6, 5, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 175
    [6, 5, 9, 6, 9, 8, 6, 8, 11, -1, -1, -1, -1, -1, -1], // 176
    [0, 3, 11, 0, 11, 6, 0, 6, 5, 0, 5, 9, -1, -1, -1], // 177
    [1, 0, 8, 1, 8, 11, 1, 11, 6, 1, 6, 5, -1, -1, -1], // 178
    [1, 3, 11, 1, 11, 6, 1, 6, 5, -1, -1, -1, -1, -1, -1], // 179
    [2, 1, 9, 2, 9, 8, 2, 8, 11, 6, 5, 10, -1, -1, -1], // 180
    [0, 1, 9, 2, 3, 11, 6, 5, 10, -1, -1, -1, -1, -1, -1], // 181
    [2, 0, 8, 2, 8, 11, 6, 5, 10, -1, -1, -1, -1, -1, -1], // 182
    [2, 3, 11, 6, 5, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 183
    [3, 2, 6, 3, 6, 5, 3, 5, 9, 3, 9, 8, -1, -1, -1], // 184
    [0, 2, 6, 0, 6, 5, 0, 5, 9, -1, -1, -1, -1, -1, -1], // 185
    [3, 0, 8, 1, 2, 6, 1, 6, 5, -1, -1, -1, -1, -1, -1], // 186
    [1, 2, 6, 1, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 187
    [3, 1, 9, 3, 9, 8, 6, 5, 10, -1, -1, -1, -1, -1, -1], // 188
    [0, 1, 9, 6, 5, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 189
    [3, 0, 8, 6, 5, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 190
    [6, 5, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 191
    [5, 7, 11, 5, 11, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 192
    [0, 3, 11, 0, 11, 10, 0, 10, 5, 0, 5, 7, 0, 7, 8], // 193
    [1, 0, 9, 1, 9, 5, 1, 5, 7, 1, 7, 11, 1, 11, 10], // 194
    [1, 3, 11, 1, 11, 10, 5, 7, 8, 5, 8, 9, -1, -1, -1], // 195
    [2, 1, 5, 2, 5, 7, 2, 7, 11, -1, -1, -1, -1, -1, -1], // 196
    [0, 1, 5, 0, 5, 7, 0, 7, 8, 2, 3, 11, -1, -1, -1], // 197
    [2, 0, 9, 2, 9, 5, 2, 5, 7, 2, 7, 11, -1, -1, -1], // 198
    [2, 3, 11, 5, 7, 8, 5, 8, 9, -1, -1, -1, -1, -1, -1], // 199
    [3, 2, 10, 3, 10, 5, 3, 5, 7, -1, -1, -1, -1, -1, -1], // 200
    [0, 2, 10, 0, 10, 5, 0, 5, 7, 0, 7, 8, -1, -1, -1], // 201
    [3, 0, 9, 3, 9, 5, 3, 5, 7, 1, 2, 10, -1, -1, -1], // 202
    [1, 2, 10, 5, 7, 8, 5, 8, 9, -1, -1, -1, -1, -1, -1], // 203
    [3, 1, 5, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 204
    [0, 1, 5, 0, 5, 7, 0, 7, 8, -1, -1, -1, -1, -1, -1], // 205
    [3, 0, 9, 3, 9, 5, 3, 5, 7, -1, -1, -1, -1, -1, -1], // 206
    [5, 7, 8, 5, 8, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 207
    [5, 4, 8, 5, 8, 11, 5, 11, 10, -1, -1, -1, -1, -1, -1], // 208
    [0, 3, 11, 0, 11, 10, 0, 10, 5, 0, 5, 4, -1, -1, -1], // 209
    [1, 0, 8, 1, 8, 11, 1, 11, 10, 5, 4, 9, -1, -1, -1], // 210
    [1, 3, 11, 1, 11, 10, 5, 4, 9, -1, -1, -1, -1, -1, -1], // 211
    [2, 1, 5, 2, 5, 4, 2, 4, 8, 2, 8, 11, -1, -1, -1], // 212
    [0, 1, 5, 0, 5, 4, 2, 3, 11, -1, -1, -1, -1, -1, -1], // 213
    [2, 0, 8, 2, 8, 11, 5, 4, 9, -1, -1, -1, -1, -1, -1], // 214
    [2, 3, 11, 5, 4, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 215
    [3, 2, 10, 3, 10, 5, 3, 5, 4, 3, 4, 8, -1, -1, -1], // 216
    [0, 2, 10, 0, 10, 5, 0, 5, 4, -1, -1, -1, -1, -1, -1], // 217
    [3, 0, 8, 1, 2, 10, 5, 4, 9, -1, -1, -1, -1, -1, -1], // 218
    [1, 2, 10, 5, 4, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 219
    [3, 1, 5, 3, 5, 4, 3, 4, 8, -1, -1, -1, -1, -1, -1], // 220
    [0, 1, 5, 0, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 221
    [3, 0, 8, 5, 4, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 222
    [5, 4, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 223
    [4, 7, 11, 4, 11, 10, 4, 10, 9, -1, -1, -1, -1, -1, -1], // 224
    [0, 3, 11, 0, 11, 10, 0, 10, 9, 4, 7, 8, -1, -1, -1], // 225
    [1, 0, 4, 1, 4, 7, 1, 7, 11, 1, 11, 10, -1, -1, -1], // 226
    [1, 3, 11, 1, 11, 10, 4, 7, 8, -1, -1, -1, -1, -1, -1], // 227
    [2, 1, 9, 2, 9, 4, 2, 4, 7, 2, 7, 11, -1, -1, -1], // 228
    [0, 1, 9, 2, 3, 11, 4, 7, 8, -1, -1, -1, -1, -1, -1], // 229
    [2, 0, 4, 2, 4, 7, 2, 7, 11, -1, -1, -1, -1, -1, -1], // 230
    [2, 3, 11, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 231
    [3, 2, 10, 3, 10, 9, 3, 9, 4, 3, 4, 7, -1, -1, -1], // 232
    [0, 2, 10, 0, 10, 9, 4, 7, 8, -1, -1, -1, -1, -1, -1], // 233
    [3, 0, 4, 3, 4, 7, 1, 2, 10, -1, -1, -1, -1, -1, -1], // 234
    [1, 2, 10, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 235
    [3, 1, 9, 3, 9, 4, 3, 4, 7, -1, -1, -1, -1, -1, -1], // 236
    [0, 1, 9, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 237
    [3, 0, 4, 3, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 238
    [4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 239
    [9, 8, 11, 9, 11, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 240
    [0, 3, 11, 0, 11, 10, 0, 10, 9, -1, -1, -1, -1, -1, -1], // 241
    [1, 0, 8, 1, 8, 11, 1, 11, 10, -1, -1, -1, -1, -1, -1], // 242
    [1, 3, 11, 1, 11, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 243
    [2, 1, 9, 2, 9, 8, 2, 8, 11, -1, -1, -1, -1, -1, -1], // 244
    [0, 1, 9, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 245
    [2, 0, 8, 2, 8, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 246
    [2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 247
    [3, 2, 10, 3, 10, 9, 3, 9, 8, -1, -1, -1, -1, -1, -1], // 248
    [0, 2, 10, 0, 10, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 249
    [3, 0, 8, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 250
    [1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 251
    [3, 1, 9, 3, 9, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 252
    [0, 1, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 253
    [3, 0, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 254
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1], // 255
];

/* Marching cubes over a grid field: field[(z * ny + y) * nx + x] sampled at origin + step · (x, y, z)
   (origin an [x, y, z] array). Vertices are welded per grid edge; normals are the field's gradient
   (pointing outward, from inside to outside), interpolated along each edge. Returns a BufferGeometry
   with an index. */
export function isoGeometry(THREE, field, nx, ny, nz, origin, step, level) {
    const N = nx * ny * nz;
    if (field.length !== N) throw new Error('kit.iso: field length is not nx · ny · nz');
    const at = (x, y, z) => (z * ny + y) * nx + x;
    const dims = [nx, ny, nz];
    const grad = (x, y, z) => {
        const c = [x, y, z];
        const g = [0, 0, 0];
        for (let a = 0; a < 3; a++) {
            const lo = c[a] > 0 ? c[a] - 1 : c[a];
            const hi = c[a] < dims[a] - 1 ? c[a] + 1 : c[a];
            const p = c.slice();
            const q = c.slice();
            p[a] = hi;
            q[a] = lo;
            g[a] = (field[at(...p)] - field[at(...q)]) / ((hi - lo) * step);
        }
        return g;
    };
    /* per edge: the lower corner's offset in the grid, and the axis it runs along */
    const lowOff = MC_EDGE.map(([a, b]) => {
        const A = MC_CORNER[a];
        const B = MC_CORNER[b];
        return [Math.min(A[0], B[0]), Math.min(A[1], B[1]), Math.min(A[2], B[2])];
    });
    const axisOf = MC_EDGE.map(([a, b]) => {
        const A = MC_CORNER[a];
        const B = MC_CORNER[b];
        return A[0] !== B[0] ? 0 : A[1] !== B[1] ? 1 : 2;
    });
    const edgeVert = new Int32Array(N * 3).fill(-1);
    const pos = [];
    const nor = [];
    const index = [];
    let count = 0;
    const val = new Float64Array(8);
    const vertexOn = (e, x, y, z) => {
        const [a, b] = MC_EDGE[e];
        const L = lowOff[e];
        const key = at(x + L[0], y + L[1], z + L[2]) * 3 + axisOf[e];
        if (edgeVert[key] >= 0) return edgeVert[key];
        const A = MC_CORNER[a];
        const B = MC_CORNER[b];
        const t = (level - val[a]) / (val[b] - val[a]);
        const pa = [x + A[0], y + A[1], z + A[2]];
        const pb = [x + B[0], y + B[1], z + B[2]];
        for (let i = 0; i < 3; i++) pos.push(origin[i] + step * (pa[i] + t * (pb[i] - pa[i])));
        const ga = grad(...pa);
        const gb = grad(...pb);
        const n = [0, 1, 2].map((i) => ga[i] + (gb[i] - ga[i]) * t);
        const l = Math.hypot(n[0], n[1], n[2]) || 1;
        nor.push(n[0] / l, n[1] / l, n[2] / l);
        edgeVert[key] = count;
        return count++;
    };
    for (let z = 0; z < nz - 1; z++) {
        for (let y = 0; y < ny - 1; y++) {
            for (let x = 0; x < nx - 1; x++) {
                let ci = 0;
                for (let c = 0; c < 8; c++) {
                    const o = MC_CORNER[c];
                    val[c] = field[at(x + o[0], y + o[1], z + o[2])];
                    if (val[c] < level) ci |= 1 << c;
                }
                if (ci === 0 || ci === 255) continue;
                const row = MC_TRI[ci];
                for (let k = 0; k < 15 && row[k] >= 0; k += 3) {
                    const v0 = vertexOn(row[k], x, y, z);
                    const v1 = vertexOn(row[k + 1], x, y, z);
                    const v2 = vertexOn(row[k + 2], x, y, z);
                    index.push(v0, v1, v2);
                }
            }
        }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setIndex(index);
    return g;
}

/* The trilinear field below the level, on the same grid: true inside, false outside the grid. */
export function isoInside(field, nx, ny, nz, origin, step, level) {
    const at = (x, y, z) => (z * ny + y) * nx + x;
    return (x, y, z) => {
        const g = [x, y, z].map((v, i) => (v - origin[i]) / step);
        if (g[0] < 0 || g[1] < 0 || g[2] < 0 || g[0] > nx - 1 || g[1] > ny - 1 || g[2] > nz - 1) return false;
        const i0 = Math.max(0, Math.min(nx - 2, Math.floor(g[0])));
        const j0 = Math.max(0, Math.min(ny - 2, Math.floor(g[1])));
        const k0 = Math.max(0, Math.min(nz - 2, Math.floor(g[2])));
        const fx = g[0] - i0;
        const fy = g[1] - j0;
        const fz = g[2] - k0;
        let v = 0;
        for (let c = 0; c < 8; c++) {
            const o = MC_CORNER[c];
            const w = (o[0] ? fx : 1 - fx) * (o[1] ? fy : 1 - fy) * (o[2] ? fz : 1 - fz);
            v += w * field[at(i0 + o[0], j0 + o[1], k0 + o[2])];
        }
        return v < level;
    };
}
