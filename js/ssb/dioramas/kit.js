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
            absolute RAS height (untilted solids only)
   three.js is passed in (build(THREE, params)), never imported, so every
   diorama module stays loadable without WebGL — graph mode reads their
   PARAMS for the URL whitelist.
   ============================================================= */
import { rasToScene } from '../frame.js?v=f554e767';

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
    if (s.kind === 'super') {
        if (s.zMin !== undefined && z < s.zMin) return false;
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
    const reach = s.tilt ? Math.hypot(s.r[1], s.r[2]) : null;
    const r = [s.r[0], reach || s.r[1], reach || s.r[2]];
    const b = { min: s.c.map((c, i) => c - r[i]), max: s.c.map((c, i) => c + r[i]) };
    if (s.zMin !== undefined) b.min[2] = Math.max(b.min[2], s.zMin);
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
    for (let j = 0; j <= segV; j++) {
        const v = v0 + (j / segV) * (Math.PI / 2 - v0);
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

/* A tube along RAS points (centripetal Catmull-Rom, docs/ssb.md 5.5). */
export function tubeGeometry(THREE, points, radius, radial = 12) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
    const segs = Math.max(8, Math.round(curve.getLength() * 3));
    return new THREE.TubeGeometry(curve, segs, radius, radial, false);
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
   (so a pick selects the entity). `look` tells the lab which token material
   to use: { tint, cut?, space?, ghost?, doubleSide? }; `hazards` lists the
   graph's hazard ids for a hazard site (hatched by the lab). */
export function tag(obj, id, side, look, extra = {}) {
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
