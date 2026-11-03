"""Stack checks (T2 part 1) and the committed CT volume (T2 part 2).

    .venv/bin/python -I tools/tbone-pipeline/volume.py check   # stacks section of work/registration.json
    .venv/bin/python -I tools/tbone-pipeline/volume.py build   # tbone/ct/ct.u8.gz + ct.json (needs work/frame.json from scale.py)

check: window level per stack (soft-tissue mode must be the same for all four, which is what lets the
planes be compared and boneness share constants), the axial FOV circle, the reformats' content rows, and
whether the scout bands are evenly stepped (they are a hover map, so they encode slice order only).

build: the axial display volume resampled to isotropic voxels in the OLSB frame (mm; x lateral, y
anterior, z superior; origin = centre of the oval window; a right ear), cropped to the temporal bone.
Values are the 8-bit display levels of the capture (not HU). Resampling is trilinear over the axial
stack (in-plane pixel s mm, slice step dz mm); the slice step is the coarse axis, so the finest real
detail in z is about one slice.
"""
import gzip, json, os, sys
import numpy as np
from scipy import ndimage as ndi

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402
import geom as G  # noqa: E402

VOX = 0.3   # mm, isotropic; OLSB's specimen grid (js/olsb/volume.js)
# crop box in the OLSB frame, mm: lateral/medial x, posterior/anterior y, inferior/superior z (set by build())
BOX = {'x': (-34.0, 30.0), 'y': (-28.0, 24.0), 'z': (-26.0, 24.0)}


def check():
    sv = C.ssb('volume')
    man = C.manifest()
    out = {}
    for plane in C.PLANES:
        V = C.load(plane)
        h = np.bincount(V[V.shape[0] // 2][110:400, 60:450].ravel(), minlength=256).astype(float)
        soft = int(np.argmax(ndi.gaussian_filter1d(h, 2)))
        rows = [np.nonzero((g > 45).any(1))[0] for g in V]
        info = {'slices': int(V.shape[0]), 'size_wh': [int(V.shape[2]), int(V.shape[1])],
                'soft_tissue_mode': soft, 'max_level': int(V.max()),
                'content_rows': [int(np.median([r.min() for r in rows])), int(np.median([r.max() for r in rows])) + 1]}
        r = np.array([s['scout_rect'] for s in man[plane]['slices']], float)
        axis = 1 if plane in ('axial', 'coronal', 'parallel') else 0   # bands are rows (axial/coronal/parallel) or columns
        c = (r[:, axis] + r[:, axis + 2]) / 2
        step = np.diff(c)
        info['scout'] = {'file': man[plane]['scout'], 'band_axis': 'rows' if axis else 'columns',
                         'step_px_mean': round(float(step.mean()), 3), 'step_px_sd': round(float(step.std()), 3),
                         'monotonic': bool((step > 0).all()),
                         'note': 'hover-map bands: slice order, not measured positions'}
        if plane == 'axial':
            Cc = sv.axial_fov(V[:6])
            info['fov_circle'] = {'cx': round(float(Cc[:, 0].mean()), 2), 'cy': round(float(Cc[:, 1].mean()), 2),
                                  'r': round(float(Cc[:, 2].mean()), 2), 'fit_residual_px': round(float(Cc[:, 3].mean()), 3)}
            sh = sv.adjacent_shifts(V)
            m = np.hypot(sh[:, 0], sh[:, 1])
            info['adjacent_slice_shift_px'] = {'median': round(float(np.median(m)), 3), 'max': round(float(m.max()), 3)}
        out[plane] = info
        print(plane, json.dumps(info))
    C.write_results('stacks', out)


def frame():
    return json.load(open(os.path.join(C.WORK, 'frame.json')))


def build():
    fr = frame()
    s, dzmm = fr['s_mm_per_px'], fr['dz_mm']
    ox, oy, on = fr['origin_px']       # oval-window centre: axial pixel x, y and (fractional, 0-based) slice n
    V = C.load('axial').astype(np.float32)
    xs = np.arange(BOX['x'][0], BOX['x'][1] + 1e-6, VOX)
    ys = np.arange(BOX['y'][0], BOX['y'][1] + 1e-6, VOX)
    zs = np.arange(BOX['z'][0], BOX['z'][1] + 1e-6, VOX)
    # OLSB (x lateral, y anterior, z superior) -> axial pixels: lateral is image left, anterior is image up,
    # superior is lower slice index
    gx = ox - xs / s
    gy = oy - ys / s
    gn = on - zs / dzmm
    N, H, W = V.shape
    Z, Y, X = np.meshgrid(gn, gy, gx, indexing='ij')           # (z, y, x) of the output grid, in axial index space
    out = ndi.map_coordinates(V, [Z, Y, X], order=1, mode='constant', cval=0.0)
    inside = (Z >= 0) & (Z <= N - 1) & (Y >= 0) & (Y <= H - 1) & (X >= 0) & (X <= W - 1) & (np.hypot(X - 255.5, Y - 255.5) < 252)
    src = np.where(inside, 1, 0).astype(np.uint8)
    out[~inside] = 0
    # The axial stack is only ~16 mm tall (61 slices). Outside it, fill from the coronal / parallel / perpendicular
    # stacks (reformats of the same acquisition, registered by register.py; same display window): trilinear
    # sample of each stack at the voxel, mean over the stacks that cover it. source = 2 there.
    acc = np.zeros(out.shape, np.float32); wsum = np.zeros(out.shape, np.float32)
    for plane in ('coronal', 'parallel', 'perpendicular'):
        prm = G.reg_params(plane)
        O, e1, e2, w, dzp = G.REG.frame('x', prm, G.EYE)
        M = np.linalg.inv(np.stack([e1, e2, w], 1))
        rows = json.load(open(os.path.join(C.WORK, f'registration-{plane}.json')))['rows']
        St = C.load(plane).astype(np.float32)
        P = np.stack([X.ravel(), Y.ravel(), Z.ravel() * dzp], 0)
        uvk = M @ (P - O[:, None])
        u, v, k = uvk
        ok = (k >= 0) & (k <= St.shape[0] - 1) & (v >= rows[0] + 3) & (v <= rows[1] - 4) & (u >= 2) & (u <= 509)
        val = np.zeros(len(u), np.float32)
        if ok.any():
            val[ok] = ndi.map_coordinates(St, [k[ok], v[ok], u[ok]], order=1, mode='nearest')
        ok &= val > 0
        acc += (val * ok).reshape(out.shape); wsum += ok.reshape(out.shape).astype(np.float32)
    fill = (~inside) & (wsum > 0)
    out[fill] = acc[fill] / wsum[fill]
    src[fill] = 2
    u8 = np.clip(np.rint(out), 0, 255).astype(np.uint8)
    os.makedirs(os.path.join(C.OUT, 'ct'), exist_ok=True)
    with gzip.GzipFile(os.path.join(C.OUT, 'ct', 'ct.u8.gz'), 'wb', 9, mtime=0) as f:
        f.write(u8.tobytes())     # C order: [z][y][x], x fastest
    with gzip.GzipFile(os.path.join(C.OUT, 'ct', 'source.u8.gz'), 'wb', 9, mtime=0) as f:
        f.write(src.tobytes())
    meta = {
        'source_map': 'ct/source.u8.gz, same grid: 0 = no data, 1 = axial stack, 2 = reformatted coronal / parallel / perpendicular stacks (mean of those covering the voxel; slice step 1.1 mm, so coarser across their slice direction)',
        'dims': [int(u8.shape[2]), int(u8.shape[1]), int(u8.shape[0])],
        'dims_order': 'x fastest; array index [k][j][i] = z, y, x',
        'spacing_mm': VOX,
        'origin_mm': [BOX['x'][0], BOX['y'][0], BOX['z'][0]],
        'origin_note': 'frame position (mm) of voxel [0,0,0]; voxel i,j,k is at origin + (i,j,k) * spacing_mm',
        'frame': 'OLSB (js/olsb/volume.js): mm, a right ear, x lateral, y anterior, z superior; (0,0,0) = centre of the oval window',
        'dtype': 'uint8 display levels of the capture (air = the window floor, about 43; soft tissue about 110; dense bone 200-255); not HU. Voxels with no data are 0 (see source_map)',
        'resampling': 'trilinear from the axial stack; in-plane pixel and slice step from the scale; where the axial stack does not reach (it is about 16 mm tall) from the three reformatted stacks (source = 2); outside everything 0',
        'source': {'atlas': 'UW Interactive CT Temporal Bone atlas, normal, axial plane', 'slices': int(N), 'slice_size': [int(W), int(H)]},
        'scale': fr,
        'coverage_fraction': {'axial': round(float((src == 1).mean()), 4), 'reformats_only': round(float((src == 2).mean()), 4), 'none': round(float((src == 0).mean()), 4)},
    }
    json.dump(meta, open(os.path.join(C.OUT, 'ct', 'ct.json'), 'w'), indent=1)
    print('ct dims', meta['dims'], 'bytes gz', os.path.getsize(os.path.join(C.OUT, 'ct', 'ct.u8.gz')), 'coverage', meta['coverage_fraction'])


if __name__ == '__main__':
    {'check': check, 'build': build}[sys.argv[1] if len(sys.argv) > 1 else 'check']()
