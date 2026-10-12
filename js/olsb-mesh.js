/* =============================================================
   olsb-mesh.js — OLSB 3D model: turns the labelled voxel grids of
   js/olsb-volume.js into surfaces. DOM-free and three.js-free: it returns
   typed arrays, so it runs in the page or in the volume's Web Worker
   (js/olsb-3d.js asks the worker, and falls back to calling it here).

   Smooth (the default): a surface net on the shown voxels. Each quad
   between a shown voxel and an empty one keeps its label; its corners
   start at the mean of the occupancy crossings round them, then step to
   the half level of the occupancy, softened by each voxel's sub-voxel
   depth (the volume's `dep`) and a small Gaussian, whose gradient is the
   normal. Blocks: the corners stay on the lattice, with face normals and
   vertex occlusion. Large-scale occlusion (openness) darkens cavities
   either way. Grids are listed coarse to fine; a finer one replaces the
   coarser voxels inside its box, and samples past its edge come from the
   coarser ones.
   ============================================================= */
(function () {
    'use strict';

    var root = typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : globalThis;
    var O = root.OLSB || (root.OLSB = {});

    /* What is drawn of each voxel: vt maps label -> 0 hidden, 1 solid, 2 ghost; a cut plane
       (axis, position as a fraction of cutBox, flip) hides one side. */
    function computeShown(L, vt, cut, cutBox) {
        const lab = L.lab, n = lab.length;
        const shown = L.shown && L.shown.length === n ? L.shown : new Uint8Array(n);
        for (let i = 0; i < n; i++) shown[i] = vt[lab[i]];
        if (cut && cut.axis !== 'none') {
            const ax = { sag: 0, cor: 1, ax: 2 }[cut.axis];
            const mm = cutBox[ax] + (cutBox[ax + 3] - cutBox[ax]) * cut.pos;
            const cutAt = Math.round((mm - L.o[ax]) / L.vox), nx = L.nx, ny = L.ny;
            for (let k = 0; k < L.nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
                const c = ax === 0 ? i : ax === 1 ? j : k;
                if (cut.flip ? c < cutAt : c >= cutAt) shown[i + nx * (j + ny * k)] = 0;
            }
        }
        L.shown = shown;
    }
    /* shown value at a model point (mm), from the finest of the levels that covers it */
    function shownAtIn(levels, x, y, z) {
        for (let n = levels.length - 1; n >= 0; n--) {
            const L = levels[n];
            const i = Math.floor((x - L.o[0]) / L.vox), j = Math.floor((y - L.o[1]) / L.vox), k = Math.floor((z - L.o[2]) / L.vox);
            if (i >= 0 && j >= 0 && k >= 0 && i < L.nx && j < L.ny && k < L.nz) return L.shown[i + L.nx * (j + L.ny * k)];
        }
        return 0;
    }

    /* ---------- meshing ---------- */
    const FACES = [
        /* axis, sign, shade (x lat, y ant, z sup): top brightest, bottom darkest */
        [0, 1, 0.84], [0, -1, 0.7], [1, 1, 0.78], [1, -1, 0.74], [2, 1, 1.0], [2, -1, 0.56]
    ];
    /* vertex occlusion by how many of the three neighbours are solid; gentler on the fine grid, whose steps are small */
    const AO = { coarse: [0.55, 0.72, 0.87, 1], fine: [0.68, 0.8, 0.91, 1], micro: [0.74, 0.84, 0.93, 1] };
    function hash(i) { let h = Math.imul(i ^ (i >>> 15), 2246822519); h ^= h >>> 13; return ((h >>> 0) % 1000) / 1000; }

    /* Large-scale occlusion on the coarse grid, in 0.9 mm cells: the share of 14 directions
       that escape within a few millimetres. Deep cavities and crevices go dark, edges stay lit. */
    const ODIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
        [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1], [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1]];
    function openness(L) {
        const shown = L.shown, nx = L.nx, ny = L.ny, nz = L.nz, F = 3, REACH = 8;
        const cx = Math.ceil(nx / F), cy = Math.ceil(ny / F), cz = Math.ceil(nz / F), n = cx * cy * cz;
        const cnt = new Uint16Array(n);
        for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) {
            const row = nx * (j + ny * k), crow = cx * (((j / F) | 0) + cy * ((k / F) | 0));
            for (let i = 0; i < nx; i++) if (shown[row + i] === 1) cnt[crow + ((i / F) | 0)]++;
        }
        const occ = new Uint8Array(n), lim = F * F * F * 0.45;
        for (let c = 0; c < n; c++) occ[c] = cnt[c] > lim ? 1 : 0;
        const open = new Float32Array(n);
        for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) {
            let esc = 0;
            for (let d = 0; d < 14; d++) {
                const D = ODIRS[d];
                let x = i, y = j, z = k, hit = false;
                for (let r = 0; r < REACH; r++) {
                    x += D[0]; y += D[1]; z += D[2];
                    if (x < 0 || y < 0 || z < 0 || x >= cx || y >= cy || z >= cz) break;
                    if (occ[x + cx * (y + cy * z)]) { hit = true; break; }
                }
                if (!hit) esc++;
            }
            open[i + cx * (j + cy * k)] = esc / 14;
        }
        const s = L.vox * F;
        const cell = (i, j, k) => (i < 0 || j < 0 || k < 0 || i >= cx || j >= cy || k >= cz) ? 1 : Math.min(1, open[i + cx * (j + cy * k)] / 0.64);
        /* trilinear between cell centres, so the shading has no cell edges */
        return (x, y, z) => {
            const fx = (x - L.o[0]) / s - 0.5, fy = (y - L.o[1]) / s - 0.5, fz = (z - L.o[2]) / s - 0.5;
            const i = Math.floor(fx), j = Math.floor(fy), k = Math.floor(fz), tx = fx - i, ty = fy - j, tz = fz - k;
            let r = 0;
            for (let c = 0; c < 8; c++) {
                const a = c & 1, b = (c >> 1) & 1, d = (c >> 2) & 1;
                r += cell(i + a, j + b, k + d) * (a ? tx : 1 - tx) * (b ? ty : 1 - ty) * (d ? tz : 1 - tz);
            }
            return r;
        };
    }

    /* Surfaces. Smooth (the default) is a surface net on the grid of shown voxels: every quad
       between a shown voxel and an empty one keeps its label, but its corners move to the mean
       of the occupancy crossings round them and take a normal from the occupancy gradient over
       a 4x4x4 neighbourhood, so steps become slopes and the light reads them as curves. Blocks
       keeps the corners on the lattice with face normals. The same quads either way, so picking,
       colouring and selection do not care which. */
    /* Occupancy (solid, or any shown voxel for the ghost mesh) blurred by a separable Gaussian,
       on the grid padded by PAD voxels from the coarser grids. Voxel centres sit at i + 0.5. */
    const PAD = 2, KERNEL = (() => { const k = []; for (let d = -PAD; d <= PAD; d++) k.push(Math.exp(-d * d / (2 * 0.85 * 0.85))); const t = k.reduce((x, y) => x + y, 0); return k.map((x) => x / t); })();
    function blurOccupancy(L, at, ghost) {
        const X = L.nx + 2 * PAD, Y = L.ny + 2 * PAD, Z = L.nz + 2 * PAD, n = X * Y * Z, XY = X * Y;
        let a = new Float32Array(n), t = new Float32Array(n);
        const sh = L.shown, dep = L.dep, nx = L.nx, ny = L.ny, nz = L.nz;
        for (let k = 0; k < Z; k++) for (let j = 0; j < Y; j++) {
            const gk = k - PAD, gj = j - PAD, row = X * (j + Y * k);
            const inYZ = gj >= 0 && gj < ny && gk >= 0 && gk < nz;
            for (let i = 0; i < X; i++) {
                const gi = i - PAD;
                /* inside the grid: half plus or minus half the sub-voxel depth, so the half level
                   falls where the shapes' surfaces are; past its edge, plain occupancy */
                if (inYZ && gi >= 0 && gi < nx) {
                    const id = gi + nx * (gj + ny * gk), s = sh[id], h = dep ? dep[id] / 510 : 0.5;
                    a[row + i] = (ghost ? s !== 0 : s === 1) ? 0.5 + h : 0.5 - h;
                } else {
                    const s = at(gi, gj, gk);
                    a[row + i] = (ghost ? s !== 0 : s === 1) ? 1 : 0;
                }
            }
        }
        const k0 = KERNEL[0], k1 = KERNEL[1], k2 = KERNEL[2];
        /* separable passes; the PAD-wide rim keeps its unblurred values (only the interior is sampled) */
        const pass = (sd, lo1, hi1) => {
            t.set(a);
            for (let k = 0; k < Z; k++) for (let j = 0; j < Y; j++) {
                const row = X * j + XY * k;
                for (let i = 0; i < X; i++) {
                    const c = sd === 1 ? i : sd === X ? j : k;
                    if (c < lo1 || c >= hi1) continue;
                    const id = row + i;
                    t[id] = k0 * (a[id - 2 * sd] + a[id + 2 * sd]) + k1 * (a[id - sd] + a[id + sd]) + k2 * a[id];
                }
            }
            const x = a; a = t; t = x;
        };
        pass(1, 2, X - 2); pass(X, 2, Y - 2); pass(XY, 2, Z - 2);
        return { a, X, Y, Z };
    }
    /* The blurred field at a point in lattice units (corners at integers), trilinear, with its
       gradient written into g. */
    function field(F, x, y, z, g) {
        const fx = x - 0.5 + PAD, fy = y - 0.5 + PAD, fz = z - 0.5 + PAD;
        const i = Math.max(0, Math.min(F.X - 2, Math.floor(fx))), j = Math.max(0, Math.min(F.Y - 2, Math.floor(fy))), k = Math.max(0, Math.min(F.Z - 2, Math.floor(fz)));
        const tx = fx - i, ty = fy - j, tz = fz - k, a = F.a, X = F.X, XY = F.X * F.Y, b = i + X * j + XY * k;
        const c000 = a[b], c100 = a[b + 1], c010 = a[b + X], c110 = a[b + X + 1];
        const c001 = a[b + XY], c101 = a[b + XY + 1], c011 = a[b + XY + X], c111 = a[b + XY + X + 1];
        const x00 = c000 + (c100 - c000) * tx, x10 = c010 + (c110 - c010) * tx, x01 = c001 + (c101 - c001) * tx, x11 = c011 + (c111 - c011) * tx;
        const y0 = x00 + (x10 - x00) * ty, y1 = x01 + (x11 - x01) * ty;
        g[0] = ((c100 - c000) * (1 - ty) + (c110 - c010) * ty) * (1 - tz) + ((c101 - c001) * (1 - ty) + (c111 - c011) * ty) * tz;
        g[1] = (x10 - x00) * (1 - tz) + (x11 - x01) * tz;
        g[2] = y1 - y0;
        return y0 + (y1 - y0) * tz;
    }
    /* Per face: its 4 lattice corners (offsets from the voxel), and for each corner the three
       neighbours in front of the face that occlude it (blocks mode). Corners run counter-clockwise
       about the face's axis (u = ax+1, w = ax+2). */
    const FACE_TAB = FACES.map(([ax, sg]) => {
        const u = (ax + 1) % 3, w = (ax + 2) % 3, plane = sg > 0 ? 1 : 0, corners = [], occl = [];
        for (let c = 0; c < 4; c++) {
            const cu = c === 1 || c === 2 ? 1 : 0, cw = c >= 2 ? 1 : 0;
            const p = [0, 0, 0]; p[ax] = plane; p[u] = cu; p[w] = cw;
            corners.push(p);
            const f = [0, 0, 0]; f[ax] = sg;
            const p1 = f.slice(), p2 = f.slice(), p3 = f.slice();
            p1[u] += cu ? 1 : -1; p2[w] += cw ? 1 : -1; p3[u] += cu ? 1 : -1; p3[w] += cw ? 1 : -1;
            occl.push([p1, p2, p3]);
        }
        return { ax, sg, corners, occl, front: (() => { const f = [0, 0, 0]; f[ax] = sg; return f; })() };
    });
    const C8 = new Uint8Array(8), GRAD = [0, 0, 0];
    let CTAB = null;   /* lattice corner -> slot, reused between builds */

    function buildMesh(L, openAt, skipBox, shownAt, opts) {
        const lab = L.lab, shown = L.shown, nx = L.nx, ny = L.ny, nz = L.nz, v = L.vox, o = L.o, NXY = nx * ny;
        const cav = opts.cav, aoT = AO[L.name], blocks = opts.blocks;
        /* skip voxels inside the next finer box */
        const sk = skipBox ? [0, 1, 2].map((a) => [Math.round((skipBox[a] - o[a]) / v), Math.round((skipBox[a + 3] - o[a]) / v)]) : null;
        /* neighbours past the edge of a finer grid come from the coarser ones */
        const at = (i, j, k) => (i < 0 || j < 0 || k < 0 || i >= nx || j >= ny || k >= nz)
            ? (L.name !== 'coarse' ? shownAt(o[0] + (i + 0.5) * v, o[1] + (j + 0.5) * v, o[2] + (k + 0.5) * v) : 0)
            : shown[i + nx * j + NXY * k];

        /* 1. collect the faces: voxel index * 8 + face, solid and ghost apart */
        const list = [new Uint32Array(1 << 16), new Uint32Array(1 << 12)], cnt = [0, 0];
        const push = (m, val) => {
            if (cnt[m] === list[m].length) { const g = new Uint32Array(list[m].length * 2); g.set(list[m]); list[m] = g; }
            list[m][cnt[m]++] = val;
        };
        for (let k = 0; k < nz; k++) {
            const kin = sk && k >= sk[2][0] && k < sk[2][1];
            for (let j = 0; j < ny; j++) {
                const jin = kin && j >= sk[1][0] && j < sk[1][1], row = nx * j + NXY * k;
                for (let i = 0; i < nx; i++) {
                    const idx = row + i, s = shown[idx];
                    if (!s || (jin && i >= sk[0][0] && i < sk[0][1])) continue;
                    for (let f = 0; f < 6; f++) {
                        let nb;
                        switch (f) {
                            case 0: nb = i + 1 < nx ? shown[idx + 1] : at(i + 1, j, k); break;
                            case 1: nb = i > 0 ? shown[idx - 1] : at(i - 1, j, k); break;
                            case 2: nb = j + 1 < ny ? shown[idx + nx] : at(i, j + 1, k); break;
                            case 3: nb = j > 0 ? shown[idx - nx] : at(i, j - 1, k); break;
                            case 4: nb = k + 1 < nz ? shown[idx + NXY] : at(i, j, k + 1); break;
                            default: nb = k > 0 ? shown[idx - NXY] : at(i, j, k - 1);
                        }
                        if (s === 1 ? nb === 1 : nb !== 0) continue;
                        push(s === 1 ? 0 : 1, idx * 8 + f);
                    }
                }
            }
        }

        /* 2. smooth corners: a table from lattice corner to its slot, positions/normals/openness */
        const NC = (nx + 1) * (ny + 1) * (nz + 1);
        const fields = blocks ? [] : [cnt[0] ? blurOccupancy(L, at, 0) : null, cnt[1] ? blurOccupancy(L, at, 1) : null];
        const occ = (m, i, j, k) => {
            const s = (i < 0 || j < 0 || k < 0 || i >= nx || j >= ny || k >= nz) ? at(i, j, k) : shown[i + nx * j + NXY * k];
            return m ? (s !== 0 ? 1 : 0) : (s === 1 ? 1 : 0);
        };
        function cornerStore(m, nFaces) {
            if (blocks || !nFaces) return null;
            if (!CTAB || CTAB.length < NC) CTAB = new Int32Array(NC);
            CTAB.fill(-1, 0, NC);
            return { tab: CTAB, buf: new Float32Array(nFaces * 4 * 7 + 7), n: 0, m };
        }
        function corner(S, ci, cj, ck) {
            const key = ci + (nx + 1) * (cj + (ny + 1) * ck);
            let at7 = S.tab[key];
            if (at7 >= 0) return at7;
            at7 = S.n * 7; S.n++;
            S.tab[key] = at7;
            const m = S.m, F = fields[m], cb = S.buf;
            let e = 0;
            for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) C8[e++] = occ(m, ci - 1 + dx, cj - 1 + dy, ck - 1 + dz);
            /* surface-net start: the mean of the occupancy crossings on the cell's 12 edges */
            let sx = 0, sy = 0, sz = 0, n = 0;
            for (e = 0; e < 8; e++) {
                const ex = e & 1, ey = (e >> 1) & 1, ez = (e >> 2) & 1;
                if (!ex && C8[e] !== C8[e | 1]) { sy += ey - 0.5; sz += ez - 0.5; n++; }
                if (!ey && C8[e] !== C8[e | 2]) { sx += ex - 0.5; sz += ez - 0.5; n++; }
                if (!ez && C8[e] !== C8[e | 4]) { sx += ex - 0.5; sy += ey - 0.5; n++; }
            }
            let px = n ? ci + sx / n : ci, py = n ? cj + sy / n : cj, pz = n ? ck + sz / n : ck;
            /* then Newton steps to the half level of the blurred occupancy, whose gradient is the normal */
            for (let it = 0; it < 3; it++) {
                const f = field(F, px, py, pz, GRAD) - 0.5, g2 = GRAD[0] * GRAD[0] + GRAD[1] * GRAD[1] + GRAD[2] * GRAD[2];
                if (g2 < 1e-8) break;
                px -= f * GRAD[0] / g2; py -= f * GRAD[1] / g2; pz -= f * GRAD[2] / g2;
                px = px < ci - 0.9 ? ci - 0.9 : px > ci + 0.9 ? ci + 0.9 : px;
                py = py < cj - 0.9 ? cj - 0.9 : py > cj + 0.9 ? cj + 0.9 : py;
                pz = pz < ck - 0.9 ? ck - 0.9 : pz > ck + 0.9 ? ck + 0.9 : pz;
            }
            field(F, px, py, pz, GRAD);
            const gl = Math.hypot(GRAD[0], GRAD[1], GRAD[2]);
            cb[at7] = px; cb[at7 + 1] = py; cb[at7 + 2] = pz;
            if (gl > 1e-6) { cb[at7 + 3] = -GRAD[0] / gl; cb[at7 + 4] = -GRAD[1] / gl; cb[at7 + 5] = -GRAD[2] / gl; }
            else { cb[at7 + 3] = 0; cb[at7 + 4] = 0; cb[at7 + 5] = 0; }
            /* openness sampled smoothly at the vertex */
            cb[at7 + 6] = m ? 1 : 0.5 + 0.5 * Math.pow(openAt(o[0] + px * v, o[1] + py * v, o[2] + pz * v), 1.3);
            return at7;
        }

        /* 3. emit */
        const out = [0, 1].map((m) => {
            const n = cnt[m], F = list[m];
            const b = { n, pos: new Float32Array(n * 12), nrm: new Int8Array(n * 12),
                shade: new Uint8Array(n * 4), lab: new Uint8Array(n), drilled: new Uint8Array(n), idx: new Uint32Array(n * 6),
                vc: blocks ? null : new Int32Array(n * 4), ncorner: 0 };
            const S = cornerStore(m, n);
            const ao = [3, 3, 3, 3];
            for (let qi = 0; qi < n; qi++) {
                const ent = F[qi], idx = ent >>> 3, f = ent & 7, T = FACE_TAB[f];
                const i = idx % nx, j = ((idx / nx) | 0) % ny, k = (idx / NXY) | 0;
                const fr = T.front, fi = i + fr[0], fj = j + fr[1], fk = k + fr[2];
                const finside = fi >= 0 && fj >= 0 && fk >= 0 && fi < nx && fj < ny && fk < nz;
                b.lab[qi] = lab[idx];
                b.drilled[qi] = finside && lab[fi + nx * fj + NXY * fk] === cav ? 1 : 0;
                const solid = m === 0, jit = blocks ? 0.96 + 0.04 * hash(idx) : 1;
                const opF = blocks && solid ? 0.5 + 0.5 * Math.pow(openAt(o[0] + (fi + 0.5) * v, o[1] + (fj + 0.5) * v, o[2] + (fk + 0.5) * v), 1.3) : 1;
                for (let c = 0; c < 4; c++) {
                    const cc = T.corners[c], ci = i + cc[0], cj = j + cc[1], ck = k + cc[2], bb = qi * 12 + c * 3;
                    let px = ci, py = cj, pz = ck, n0 = 0, n1 = 0, n2 = 0, op = opF;
                    ao[c] = 3;
                    if (blocks) {
                        if (T.ax === 0) n0 = T.sg; else if (T.ax === 1) n1 = T.sg; else n2 = T.sg;
                        if (solid) {
                            const oc = T.occl[c];
                            const s1 = at(i + oc[0][0], j + oc[0][1], k + oc[0][2]) === 1 ? 1 : 0;
                            const s2 = at(i + oc[1][0], j + oc[1][1], k + oc[1][2]) === 1 ? 1 : 0;
                            const s3 = at(i + oc[2][0], j + oc[2][1], k + oc[2][2]) === 1 ? 1 : 0;
                            ao[c] = s1 && s2 ? 0 : 3 - (s1 + s2 + s3);
                        }
                    } else {
                        const a7 = corner(S, ci, cj, ck), cb = S.buf;
                        px = cb[a7]; py = cb[a7 + 1]; pz = cb[a7 + 2]; n0 = cb[a7 + 3]; n1 = cb[a7 + 4]; n2 = cb[a7 + 5]; op = cb[a7 + 6];
                        if (!n0 && !n1 && !n2) { if (T.ax === 0) n0 = T.sg; else if (T.ax === 1) n1 = T.sg; else n2 = T.sg; }
                        b.vc[qi * 4 + c] = a7 / 7;
                    }
                    /* three: X = ant, Y = sup, Z = lat */
                    b.pos[bb] = py; b.pos[bb + 1] = pz; b.pos[bb + 2] = px;
                    b.nrm[bb] = Math.round(n1 * 127); b.nrm[bb + 1] = Math.round(n2 * 127); b.nrm[bb + 2] = Math.round(n0 * 127);
                    b.shade[qi * 4 + c] = Math.round(255 * aoT[ao[c]] * jit * op);
                }
                /* wind every quad to face out of the solid, along the diagonal that keeps occlusion smooth */
                const b4 = qi * 4, ii = qi * 6, flip = T.sg < 0;
                if (ao[0] + ao[2] > ao[1] + ao[3]) {
                    b.idx[ii] = b4; b.idx[ii + 1] = b4 + (flip ? 2 : 1); b.idx[ii + 2] = b4 + (flip ? 1 : 2);
                    b.idx[ii + 3] = b4; b.idx[ii + 4] = b4 + (flip ? 3 : 2); b.idx[ii + 5] = b4 + (flip ? 2 : 3);
                } else {
                    b.idx[ii] = b4 + 1; b.idx[ii + 1] = b4 + (flip ? 3 : 2); b.idx[ii + 2] = b4 + (flip ? 2 : 3);
                    b.idx[ii + 3] = b4 + 1; b.idx[ii + 4] = b4 + (flip ? 0 : 3); b.idx[ii + 5] = b4 + (flip ? 3 : 0);
                }
            }
            b.ncorner = S ? S.n : 0;
            return b;
        });
        return out;
    }


    /* Mesh every level. levels: coarse to fine, each { name, nx, ny, nz, vox, o, box, lab, dep };
       opts: { vt, cut, cutBox, blocks, cav }. Returns { name: [solid, ghost] } with the
       arrays each mesh needs (pos, nrm, shade, lab, drilled, idx, vc, ncorner, n). */
    function meshAll(levels, opts) {
        levels.forEach(function (L) { computeShown(L, opts.vt, opts.cut, opts.cutBox); });
        var openAt = openness(levels[0]);
        var shownAt = function (x, y, z) { return shownAtIn(levels, x, y, z); };
        var out = {};
        levels.forEach(function (L, i) {
            var finer = levels[i + 1];
            out[L.name] = buildMesh(L, openAt, finer ? finer.box : null, shownAt, opts);
        });
        return out;
    }

    O.mesh = { meshAll: meshAll, computeShown: computeShown };
})();
