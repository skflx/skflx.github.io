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
