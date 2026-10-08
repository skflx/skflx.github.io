"""16-bit head intake (docs/ssb.md 5.10; WP IN1): a NIfTI or NRRD CT in Hounsfield units -> the volume format of
docs/ssb.md 5.3 with dtype int16, placed in the 4 frame (RAS mm) from landmark correspondences.

    python3 -I tools/ssb-pipeline/intake/intake.py convert --in head.nii.gz --landmarks lm.json --name head01 [--spacing 0.5]
                                                           [--box x0 x1 y0 y1 z0 z1] [--max-rms 1.5]
    python3 -I tools/ssb-pipeline/intake/intake.py selftest

Needs numpy and scipy only (requirements.txt already pins both). DICOM would need pydicom, a new dependency: not
supported here (owner decision). Reads a file given on the command line; writes under tools/ssb-pipeline/incoming/<name>/
(gitignored) and nowhere else: no file under ssb/ changes, shipping a head is a separate decision.

Landmarks (`--landmarks`): JSON {"landmarks": [{"id": "lm.x", "src": [x, y, z], "dst": [x, y, z]}, ...]} with at least
three non-collinear points. `src` is the point in the SOURCE file's world frame expressed as RAS mm (an NRRD in LPS is
converted before it is compared, so a point read off in 3D Slicer, which shows RAS, goes in as shown); `dst` is the same
point in the 4 frame. The set is whatever the caller has; the RA landmark set (docs/realistic-anatomy.md 6.1) is the
intended one once RS6 puts it in the graph, and nothing here depends on which points are used.

Method.
  * Frame: the rigid transform (rotation + translation, no scale or shear: a CT's millimetres are real) that
    least-squares maps `src` onto `dst` (Kabsch; a reflection is refused). The RMS landmark residual is printed and
    must not exceed --max-rms (default 1.5 mm), or nothing is written.
  * Grid: isotropic --spacing (default 0.5 mm) over --box in the frame, else the bounding box of the source volume's
    corners carried into the frame. dims are capped as volume.js caps them (2048 per axis, 2^28 voxels).
  * Resample: each output voxel centre is carried back to the source and sampled trilinearly (scipy map_coordinates);
    outside the source is -1024 HU. Output voxel (i, j, k) is at RAS = affine . (i, j, k, 1), the format's convention.
  * ct.json carries values.kind "HU" (windows in HU, no LUT), standard bone and soft windows, and `levels` {air, bone}
    = the HU of the display levels scope.js uses on head A (78 and 150 through the toHU table of ssb/ct/ct.json), so
    collision behaves the same on the new head. No labels are written.
"""
import gzip
import json
import os
import re
import struct
import sys
import tempfile

import numpy as np
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
INCOMING = os.path.join(ROOT, 'tools', 'ssb-pipeline', 'incoming')
DIM_MAX = 2048
VOXELS_MAX = 1 << 28
AIR_HU = -1024.0
WINDOWS = {'bone': {'center': 400, 'width': 1800}, 'soft': {'center': 40, 'width': 400}}   # standard radiology presets


# ---------------------------------------------------------------- readers: -> (array[i, j, k], affine ijk -> RAS mm)

NIFTI_TYPES = {2: 'u1', 4: 'i2', 8: 'i4', 16: 'f4', 64: 'f8', 256: 'i1', 512: 'u2', 768: 'u4'}


def read_nifti(path):
    blob = open(path, 'rb').read()
    if blob[:2] == b'\x1f\x8b':
        blob = gzip.decompress(blob)
    for end in ('<', '>'):
        if struct.unpack(end + 'i', blob[:4])[0] == 348:
            break
    else:
        raise ValueError(f'{path}: not a NIfTI-1 file (sizeof_hdr is not 348)')
    dim = struct.unpack(end + '8h', blob[40:56])
    if not 3 <= dim[0] <= 4 or any(n < 1 for n in dim[1:4]):
        raise ValueError(f'{path}: expected a 3D volume, dim = {dim}')
    code = struct.unpack(end + 'h', blob[70:72])[0]
    if code not in NIFTI_TYPES:
        raise ValueError(f'{path}: unsupported datatype {code}')
    pixdim = struct.unpack(end + '8f', blob[76:108])
    vox_offset = int(struct.unpack(end + 'f', blob[108:112])[0])
    slope, inter = struct.unpack(end + '2f', blob[112:120])
    qform, sform = struct.unpack(end + '2h', blob[252:256])
    nx, ny, nz = dim[1:4]
    count = nx * ny * nz
    dt = np.dtype(end + NIFTI_TYPES[code])
    arr = np.frombuffer(blob, dtype=dt, count=count, offset=vox_offset).reshape(nz, ny, nx).transpose(2, 1, 0)
    arr = arr.astype(np.float32)
    if slope not in (0.0, 1.0) or inter != 0.0:
        arr = arr * (slope or 1.0) + inter
    affine = np.eye(4)
    if sform > 0:
        affine[:3, :] = np.array(struct.unpack(end + '12f', blob[280:328])).reshape(3, 4)
    elif qform > 0:
        b, c, d, ox, oy, oz = struct.unpack(end + '6f', blob[256:280])
        a = np.sqrt(max(0.0, 1.0 - b * b - c * c - d * d))
        qfac = -1.0 if pixdim[0] < 0 else 1.0
        rot = np.array([
            [a * a + b * b - c * c - d * d, 2 * (b * c - a * d), 2 * (b * d + a * c)],
            [2 * (b * c + a * d), a * a + c * c - b * b - d * d, 2 * (c * d - a * b)],
            [2 * (b * d - a * c), 2 * (c * d + a * b), a * a + d * d - b * b - c * c]])
        affine[:3, :3] = rot * np.array([pixdim[1], pixdim[2], pixdim[3] * qfac])
        affine[:3, 3] = (ox, oy, oz)
    else:
        affine[:3, :3] = np.diag(pixdim[1:4])
    return arr, affine


NRRD_TYPES = {'int16': 'i2', 'short': 'i2', 'uint8': 'u1', 'uchar': 'u1', 'int32': 'i4', 'int': 'i4',
              'float': 'f4', 'float32': 'f4', 'double': 'f8', 'uint16': 'u2', 'ushort': 'u2'}


def read_nrrd(path):
    blob = open(path, 'rb').read()
    cut = blob.index(b'\n\n')
    kv = {}
    for line in blob[:cut].decode('ascii').splitlines()[1:]:
        if ': ' in line and not line.startswith('#'):
            k, v = line.split(': ', 1)
            kv[k.strip()] = v.strip()
    t = NRRD_TYPES.get(kv.get('type', ''))
    if t is None or int(kv.get('dimension', 0)) != 3:
        raise ValueError(f'{path}: unsupported NRRD (type {kv.get("type")}, dimension {kv.get("dimension")})')
    enc = kv.get('encoding')
    body = blob[cut + 2:]
    if enc in ('gzip', 'gz'):
        body = gzip.decompress(body)
    elif enc != 'raw':
        raise ValueError(f'{path}: unsupported NRRD encoding {enc}')
    end = '>' if kv.get('endian') == 'big' else '<'
    sizes = [int(s) for s in kv['sizes'].split()]
    arr = np.frombuffer(body, dtype=np.dtype(end + t), count=int(np.prod(sizes))).reshape(sizes[::-1]).transpose(2, 1, 0).astype(np.float32)
    dirs = np.array([[float(v) for v in d.strip('()').split(',')] for d in re.findall(r'\([^)]*\)', kv['space directions'])])
    origin = np.array([float(v) for v in kv['space origin'].strip('()').split(',')])
    space = kv.get('space', '').lower().replace(' ', '-')
    if space in ('left-posterior-superior', 'lps'):
        flip = np.array([-1.0, -1.0, 1.0])
    elif space in ('right-anterior-superior', 'ras'):
        flip = np.ones(3)
    else:
        raise ValueError(f'{path}: unsupported NRRD space "{kv.get("space")}"')
    affine = np.eye(4)
    affine[:3, :3] = (dirs * flip).T            # columns = the world step of one voxel along i, j, k
    affine[:3, 3] = origin * flip
    return arr, affine


def read_head(path):
    low = path.lower()
    if low.endswith(('.nii', '.nii.gz')):
        return read_nifti(path)
    if low.endswith('.nrrd'):
        return read_nrrd(path)
    if low.endswith(('.dcm', '.dicom')) or os.path.isdir(path):
        raise ValueError('DICOM needs pydicom, a new pipeline dependency: not supported (owner decision)')
    raise ValueError(f'{path}: expected .nii, .nii.gz or .nrrd')


# ---------------------------------------------------------------- the frame

def fit_rigid(src, dst):
    """Least-squares rotation R and translation t with dst ~ R src + t (Kabsch). Returns (R, t, rms)."""
    src = np.asarray(src, float)
    dst = np.asarray(dst, float)
    if src.shape != dst.shape or src.ndim != 2 or src.shape[1] != 3 or len(src) < 3:
        raise ValueError('need at least three landmark correspondences, each an [x, y, z] pair')
    cs, cd = src.mean(0), dst.mean(0)
    h = (src - cs).T @ (dst - cd)
    if np.linalg.matrix_rank(h, tol=1e-6) < 2:
        raise ValueError('the landmarks are collinear: they do not fix a frame')
    u, _, vt = np.linalg.svd(h)
    d = np.sign(np.linalg.det(vt.T @ u.T))
    r = vt.T @ np.diag([1.0, 1.0, d]) @ u.T
    t = cd - r @ cs
    rms = float(np.sqrt(np.mean(np.sum((src @ r.T + t - dst) ** 2, axis=1))))
    return r, t, rms


def load_landmarks(path):
    doc = json.load(open(path))
    pts = doc.get('landmarks') if isinstance(doc, dict) else None
    if not isinstance(pts, list):
        raise ValueError(f'{path}: expected {{"landmarks": [{{"id", "src", "dst"}}, ...]}}')
    return [p['src'] for p in pts], [p['dst'] for p in pts], [str(p.get('id', n)) for n, p in enumerate(pts)]


# ---------------------------------------------------------------- resample + write

def head_a_levels():
    """{air, bone} in HU: the display levels scope.js uses (78 and 150) through head A's own toHU table."""
    table = json.load(open(os.path.join(ROOT, 'ssb', 'ct', 'ct.json')))['values']['toHU']
    xs, ys = [p[0] for p in table], [p[1] for p in table]
    return {'air': round(float(np.interp(78, xs, ys))), 'bone': round(float(np.interp(150, xs, ys)))}


def out_grid(arr_shape, affine_src, r, t, spacing, box):
    if box is None:
        corners = np.array([[i, j, k] for i in (0, arr_shape[0] - 1) for j in (0, arr_shape[1] - 1) for k in (0, arr_shape[2] - 1)], float)
        world = corners @ affine_src[:3, :3].T + affine_src[:3, 3]
        frame = world @ r.T + t
        lo, hi = frame.min(0), frame.max(0)
    else:
        lo, hi = np.array(box[0::2], float), np.array(box[1::2], float)
    origin = np.floor(lo / spacing) * spacing
    dims = [int(np.floor((hi[a] - origin[a]) / spacing)) + 1 for a in range(3)]
    if any(n < 1 or n > DIM_MAX for n in dims) or dims[0] * dims[1] * dims[2] > VOXELS_MAX:
        raise ValueError(f'output grid {dims} is outside volume.js limits (2048 per axis, 2^28 voxels); raise --spacing or pass --box')
    affine = np.diag([spacing, spacing, spacing, 1.0])
    affine[:3, 3] = origin
    return dims, affine


def resample(arr, affine_src, r, t, dims, affine_out):
    """int16 HU array [i, j, k] on the output grid; -1024 outside the source."""
    inv_src = np.linalg.inv(affine_src)
    out = np.empty(dims, np.int16)
    ii, jj = np.meshgrid(np.arange(dims[0]), np.arange(dims[1]), indexing='ij')
    for k in range(dims[2]):
        ijk = np.stack([ii.ravel(), jj.ravel(), np.full(ii.size, k)]).astype(float)
        frame = affine_out[:3, :3] @ ijk + affine_out[:3, 3:4]
        world = r.T @ (frame - t[:, None])
        vox = inv_src[:3, :3] @ world + inv_src[:3, 3:4]
        v = ndi.map_coordinates(arr, vox, order=1, mode='constant', cval=AIR_HU)
        out[:, :, k] = np.clip(np.rint(v), -32768, 32767).reshape(dims[0], dims[1]).astype(np.int16)
    return out


def write_head(name, hu, affine, spacing, source_note):
    out = os.path.realpath(os.path.join(INCOMING, name))
    if not re.fullmatch(r'[A-Za-z0-9._-]{1,60}', name) or os.path.commonpath([out, os.path.realpath(INCOMING)]) != os.path.realpath(INCOMING):
        raise ValueError(f'refusing to write outside {INCOMING}: name "{name}"')
    os.makedirs(out, exist_ok=True)
    meta = {
        'version': 1,
        'dims': list(hu.shape),
        'spacing': [spacing] * 3,
        'affine': [[round(float(v), 6) for v in row] for row in affine],
        'affineNote': 'voxel (i,j,k,1) -> RAS mm (docs/ssb.md 4); row-major',
        'dtype': 'int16',
        'values': {'kind': 'HU', 'note': 'Hounsfield units as stored in the source CT, resampled trilinearly; -1024 outside the source.'},
        'windows': WINDOWS,
        'levels': head_a_levels(),
        'specimen': name,
        'license': f'intake only, not licensed for the site: {source_note}',
    }
    raw = np.ascontiguousarray(hu.transpose(2, 1, 0)).astype('<i2').tobytes()    # x fastest
    with open(os.path.join(out, 'ct.i16.gz'), 'wb') as f:
        f.write(gzip.compress(raw, 9, mtime=0))
    with open(os.path.join(out, 'ct.json'), 'w') as f:
        json.dump(meta, f, indent=2)
    return out


def read_written(dirpath):
    """Read back what write_head wrote -> (int16 array [i, j, k], affine): the self-test's view of the output."""
    meta = json.load(open(os.path.join(dirpath, 'ct.json')))
    nx, ny, nz = meta['dims']
    raw = gzip.decompress(open(os.path.join(dirpath, 'ct.i16.gz'), 'rb').read())
    arr = np.frombuffer(raw, '<i2').reshape(nz, ny, nx).transpose(2, 1, 0)
    return arr, np.array(meta['affine'])


def convert(path, landmarks, name, spacing=0.5, box=None, max_rms=1.5):
    arr, affine_src = read_head(path)
    src, dst, ids = load_landmarks(landmarks)
    r, t, rms = fit_rigid(src, dst)
    if rms > max_rms:
        raise ValueError(f'landmark RMS residual {rms:.2f} mm exceeds --max-rms {max_rms}: nothing written')
    dims, affine_out = out_grid(arr.shape, affine_src, r, t, spacing, box)
    hu = resample(arr, affine_src, r, t, dims, affine_out)
    out = write_head(name, hu, affine_out, spacing, os.path.basename(path))
    print(f'{len(ids)} landmarks, rigid fit RMS {rms:.3f} mm; {dims[0]}x{dims[1]}x{dims[2]} at {spacing} mm -> {out}')
    return out


# ---------------------------------------------------------------- self-test

def _rot(axis, deg):
    c, s = np.cos(np.radians(deg)), np.sin(np.radians(deg))
    return {'x': np.array([[1, 0, 0], [0, c, -s], [0, s, c]]), 'y': np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]]),
            'z': np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])}[axis]


def _write_nifti(path, arr, affine, gz):
    nx, ny, nz = arr.shape
    h = bytearray(352)
    struct.pack_into('<i', h, 0, 348)
    struct.pack_into('<8h', h, 40, 3, nx, ny, nz, 1, 1, 1, 1)
    struct.pack_into('<h', h, 70, 4)                      # int16
    struct.pack_into('<h', h, 72, 16)
    struct.pack_into('<8f', h, 76, 1.0, *np.linalg.norm(affine[:3, :3], axis=0), 0, 0, 0, 0)
    struct.pack_into('<f', h, 108, 352.0)
    struct.pack_into('<2f', h, 112, 1.0, 0.0)
    struct.pack_into('<2h', h, 252, 0, 1)                 # qform_code 0, sform_code 1
    struct.pack_into('<12f', h, 280, *affine[:3, :].ravel())
    h[344:348] = b'n+1\0'
    data = bytes(h) + np.ascontiguousarray(arr.transpose(2, 1, 0)).astype('<i2').tobytes()
    open(path, 'wb').write(gzip.compress(data) if gz else data)


def _write_nrrd(path, arr, affine_ras, enc):
    flip = np.array([-1.0, -1.0, 1.0])                    # the file is in LPS
    dirs = (affine_ras[:3, :3] * flip[:, None]).T
    origin = affine_ras[:3, 3] * flip
    vec = lambda v: '(' + ','.join(repr(float(x)) for x in v) + ')'
    head = ('NRRD0004\ntype: int16\ndimension: 3\nspace: left-posterior-superior\n'
            f'sizes: {arr.shape[0]} {arr.shape[1]} {arr.shape[2]}\n'
            f'space directions: {" ".join(vec(d) for d in dirs)}\nkinds: domain domain domain\nendian: little\n'
            f'encoding: {enc}\nspace origin: {vec(origin)}\n\n')
    body = np.ascontiguousarray(arr.transpose(2, 1, 0)).astype('<i2').tobytes()
    open(path, 'wb').write(head.encode('ascii') + (gzip.compress(body) if enc == 'gzip' else body))


def selftest():
    """Round-trip a synthetic head through a NIfTI and an NRRD (different encodings) into the frame."""
    rng = np.random.default_rng(7)
    shape = (44, 52, 40)
    spacing_src = np.array([0.8, 0.8, 1.2])
    ijk = np.stack(np.meshgrid(*[np.arange(n) for n in shape], indexing='ij'), -1).astype(float)
    centre = np.array([22.0, 30.0, 20.0])                 # the bright sphere, in source voxels
    arr = np.full(shape, -1000.0)
    arr[np.sum(((ijk - np.array([22, 26, 20])) * spacing_src / np.array([14, 18, 20])) ** 2, -1) <= 1] = 40.0
    arr[np.linalg.norm((ijk - centre) * spacing_src, axis=-1) <= 4.0] = 1200.0
    arr = (arr + rng.normal(0, 3, shape)).round().astype(np.int16)
    # the source world: oblique, flipped in i (an LPS-like head), offset; RAS mm
    a_src = np.eye(4)
    a_src[:3, :3] = _rot('z', 20) @ _rot('x', 10) @ np.diag(spacing_src * [-1, 1, 1])
    a_src[:3, 3] = [31.0, -12.0, 8.0]
    # the true frame: rigid, 15 degrees about x and 25 about z, plus a translation
    r_true = _rot('z', 25) @ _rot('x', 15)
    t_true = np.array([-18.0, 40.0, -9.0])
    feats = np.array([[6, 8, 6], [38, 10, 7], [10, 44, 8], [30, 40, 33], [22, 30, 20]], float)
    src = feats @ a_src[:3, :3].T + a_src[:3, 3]
    lm = {'landmarks': [{'id': f'fixture.{n}', 'src': s.round(4).tolist(), 'dst': (r_true @ s + t_true).round(4).tolist()} for n, s in enumerate(src)]}
    truth = r_true @ (a_src[:3, :3] @ centre + a_src[:3, 3]) + t_true
    spacing = 1.0
    failures = []
    with tempfile.TemporaryDirectory() as tmp:
        lm_path = os.path.join(tmp, 'lm.json')
        json.dump(lm, open(lm_path, 'w'))
        cases = [('nifti-gz', 'head.nii.gz', lambda p: _write_nifti(p, arr, a_src, True)),
                 ('nifti-raw', 'head.nii', lambda p: _write_nifti(p, arr, a_src, False)),
                 ('nrrd-gzip', 'head.nrrd', lambda p: _write_nrrd(p, arr, a_src, 'gzip')),
                 ('nrrd-raw', 'head2.nrrd', lambda p: _write_nrrd(p, arr, a_src, 'raw'))]
        for label, fname, write in cases:
            path = os.path.join(tmp, fname)
            write(path)
            back, aff = read_head(path)
            ok_read = np.array_equal(back.astype(np.int16), arr) and np.allclose(aff, a_src, atol=1e-4)
            name = f'selftest-{label}'
            out = convert(path, lm_path, name, spacing=spacing, max_rms=0.01)
            try:
                hu, aff_out = read_written(out)
                bright = np.argwhere(hu > 800)
                got = aff_out[:3, :3] @ bright.mean(0) + aff_out[:3, 3]
                err = float(np.linalg.norm(got - truth) / spacing)
                inside = float(hu[tuple(np.rint(np.linalg.inv(aff_out) @ np.append(truth, 1))[:3].astype(int))])
                meta = json.load(open(os.path.join(out, 'ct.json')))
                ok_meta = meta['dtype'] == 'int16' and meta['values']['kind'] == 'HU' and 'toHU' not in meta['values'] and meta['levels']['air'] < meta['levels']['bone']
                print(f'  {label}: read back {"exact" if ok_read else "WRONG"}; bright-sphere centroid {err:.3f} voxel from the truth; centre {inside:.0f} HU; header {"ok" if ok_meta else "BAD"}')
                if not (ok_read and err <= 0.5 and inside > 800 and ok_meta):
                    failures.append(label)
            finally:
                for f in ('ct.json', 'ct.i16.gz'):
                    try:
                        os.remove(os.path.join(out, f))
                    except OSError:
                        pass
                try:
                    os.rmdir(out)
                except OSError:
                    pass
        # refusals: too few / collinear landmarks, a bad residual, a path out of incoming, a DICOM folder
        for label, fn in [
            ('two landmarks refused', lambda: fit_rigid(src[:2], src[:2])),
            ('collinear landmarks refused', lambda: fit_rigid([[0, 0, 0], [1, 0, 0], [2, 0, 0]], [[0, 0, 0], [1, 0, 0], [2, 0, 0]])),
            ('write outside incoming refused', lambda: write_head('../escape', np.zeros((2, 2, 2), np.int16), np.eye(4), 1.0, 'x')),
            ('DICOM refused', lambda: read_head(tmp)),
        ]:
            try:
                fn()
                failures.append(label)
                print(f'  {label}: NOT REFUSED')
            except ValueError:
                print(f'  {label}: ok')
        bad = {'landmarks': [dict(p, dst=[p['dst'][0] + (5 if n == 0 else 0), p['dst'][1], p['dst'][2]]) for n, p in enumerate(lm['landmarks'])]}
        json.dump(bad, open(lm_path, 'w'))
        try:
            convert(os.path.join(tmp, 'head.nii.gz'), lm_path, 'selftest-bad', max_rms=0.5)
            failures.append('bad residual refused')
            print('  bad residual refused: NOT REFUSED')
        except ValueError:
            print('  bad residual refused: ok')
    leftovers = [d for d in os.listdir(INCOMING) if d.startswith('selftest-')] if os.path.isdir(INCOMING) else []
    for d in leftovers:
        os.rmdir(os.path.join(INCOMING, d))
    if failures:
        print('FAILED: ' + ', '.join(failures))
        return 1
    print('intake self-test: all checks passed')
    return 0


def main(argv):
    if argv[:1] == ['selftest']:
        return selftest()
    if argv[:1] == ['convert']:
        args = argv[1:]
        opts = {'--in': None, '--landmarks': None, '--name': None, '--spacing': '0.5', '--max-rms': '1.5'}
        box = None
        i = 0
        while i < len(args):
            if args[i] == '--box':
                box = [float(v) for v in args[i + 1:i + 7]]
                i += 7
            elif args[i] in opts and i + 1 < len(args):
                opts[args[i]] = args[i + 1]
                i += 2
            else:
                print(__doc__)
                return 2
        if not (opts['--in'] and opts['--landmarks'] and opts['--name']) or (box is not None and len(box) != 6):
            print(__doc__)
            return 2
        try:
            convert(opts['--in'], opts['--landmarks'], opts['--name'], float(opts['--spacing']), box, float(opts['--max-rms']))
        except (ValueError, OSError) as e:
            print(f'error: {e}', file=sys.stderr)
            return 1
        return 0
    print(__doc__)
    return 2


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
