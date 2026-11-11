"""Self-test of the committed temporal-bone data (WP T2): numpy + stdlib only, no UW images needed.

    python3 -I tools/tbone-pipeline/selftest.py     (numpy and scipy required)

Asserts: ct.json dims/spacing agree with the byte count of ct.u8.gz and the oval-window origin lies
inside the box; the volume has air, soft-tissue and bone levels in plausible proportions; and UW's labelled
landmarks land on matching tissue: for each tip whose structure has a known tissue class (air: middle-ear
and mastoid air spaces, canal; fluid / soft tissue: vestibule, cochlea, IAC; bone: mastoid tip,
clivus, ...) the 0.9 mm neighbourhood of the tip must contain that class (air: a level < 60; soft: a level
in 80-150; bone: a level > 200). Arrows touch the edge of a structure, so a neighbourhood and not the
single voxel is read. Pass rates are printed; the assertion floors are stated below.
"""
import gzip, json, os, subprocess, sys, tempfile
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ingest as I  # noqa: E402
import frame as F  # noqa: E402
OUT = os.path.join(HERE, '..', '..', 'tbone')

AIR = {'epitympanum', 'hypotympanum', 'aditus', 'mastoid-antrum', 'eac', 'eustachian-tube-entrance', 'facial-recess',
       'prussaks-space'}
SOFT = {'vestibule', 'cochlea', 'basal-turn', 'middle-turn', 'apical-turn', 'iac', 'modiolus'}
BONE = {'scutum', 'mastoid-tip', 'clivus', 'petrous-apex', 'tegmen-tympani', 'pyramidal-eminence', 'promontory', 'koerners-septum'}
# floors sit just under the rates measured on this data (tips are placed on a structure's edge and the capture is
# blurred over ~0.7 mm, so a rate well below 1 is the label precision, not a failure); they catch a gross misplacement
# of the whole frame (a wrong origin, flipped axis or scale), which drops every rate to chance
FLOOR = {'air': 0.55, 'soft': 0.55, 'bone': 0.55}


def _write_nrrd(path, arr, nrrd_type, *, encoding='gzip', endian='little', dirs='(0.25,0,0) (0,0.25,0) (0,0,0.5)',
                origin='(-10,-20,30)', extra=()):
    """A minimal NRRD for the ingest tests; arr.shape is the NRRD sizes (fastest axis first)."""
    dt = arr.dtype.newbyteorder('<' if endian == 'little' else '>')
    body = arr.ravel(order='F').astype(dt).tobytes()
    lines = ['NRRD0004', '# synthetic test fixture', f'type: {nrrd_type}', f'dimension: {arr.ndim}',
             'sizes: ' + ' '.join(str(s) for s in arr.shape), 'space: left-posterior-superior',
             f'space directions: {dirs}', f'space origin: {origin}', f'endian: {endian}', f'encoding: {encoding}',
             *extra]
    data = gzip.compress(body, mtime=0) if encoding == 'gzip' else body
    open(path, 'wb').write(('\n'.join(lines) + '\n\n').encode() + data)


def _test_nrrd_round_trip(tmp):
    rng = np.random.default_rng(1)
    cases = [   # (NRRD type, numpy dtype, encoding, endian, directions, origin)
        ('int16', 'int16', 'gzip', 'little', '(0.25,0,0) (0,0.25,0) (0,0,0.5)', '(-10,-20,30)'),
        ('short', 'int16', 'raw', 'big', '(0,0.25,0) (-0.25,0,0) (0,0,0.5)', '(1.5,-2,3)'),   # rotated 90 degrees
        ('float', 'float32', 'gzip', 'big', '(0.3,0,0) (0,0.3,0) (0,0,0.3)', '(0,0,0)'),
    ]
    for nrrd_type, np_type, enc, endian, dirs, origin in cases:
        arr = rng.integers(-1000, 1000, (17, 13, 9)).astype(np_type)
        path = os.path.join(tmp, f'{nrrd_type}-{enc}-{endian}.nrrd')
        _write_nrrd(path, arr, nrrd_type, encoding=enc, endian=endian, dirs=dirs, origin=origin)
        got, header = I.read_nrrd(path)
        assert got.shape == arr.shape and np.array_equal(got, arr), f'array differs ({nrrd_type} {enc} {endian})'
        g = I.geometry(header)
        assert g['dims'] == [17, 13, 9] and g['dtype'] == arr.dtype.name, 'dims or dtype'
        want_sp = [float(np.linalg.norm(v)) for v in I._vectors(dirs)]
        assert np.allclose(g['spacing_mm'], want_sp), 'spacing'
        want_dir = [(v / np.linalg.norm(v)).tolist() for v in I._vectors(dirs)]
        assert np.allclose(g['direction'], want_dir), 'direction'
        assert np.allclose(g['origin'], [float(x) for x in origin.strip('()').split(',')]), 'origin'
        print(f'  nrrd {nrrd_type:5s} {enc:4s} {endian:6s} ok')


def _test_resample(tmp):
    shape, sp, target = (20, 18, 12), [0.25, 0.25, 0.5], 0.3
    vol = np.zeros(shape, np.float32)
    mark = (7, 11, 4)
    vol[mark] = 1000
    out, new = I.resample_iso(vol, sp, target)
    want = [round(n * s / target) for n, s in zip(shape, sp)]
    assert new == want and list(out.shape) == want, 'resampled dims'
    idx = np.array(np.unravel_index(np.argmax(out), out.shape))
    d = np.abs((idx + 0.5) * target - (np.array(mark) + 0.5) * np.array(sp))
    assert (d <= target + 1e-9).all(), f'marker moved by {d} mm'
    print(f'  resample dims {new}, marker moved {np.round(d, 3).tolist()} mm (limit {target})')
    # output origin (B3): the marker's physical position from the output meta agrees with the source's, within 0.05 mm.
    # A single voxel is too small to locate to 0.05 mm after resampling (centroid aliasing gives 0.075 mm even with
    # the origin right), so the marker is a 5x5x5 block centred on `mark`; the unshifted origin would be 0.1 mm off in z.
    mk = np.zeros(shape, np.int16)
    mk[5:10, 9:14, 2:7] = 1000
    src = os.path.join(tmp, 'marker.nrrd')
    _write_nrrd(src, mk, 'int16')
    root = os.path.join(tmp, 'marker-incoming')
    meta, real = I.ingest(src, 'MARKER', target, os.path.join(root, 'marker'), root=root)
    dims = meta['geometry']['dims']
    q = np.frombuffer(gzip.decompress(open(os.path.join(real, 'volume.i16.gz'), 'rb').read()), '<i2')
    q = q.reshape(dims, order='F').astype(float).clip(0)
    ijk = np.indices(dims)
    c = np.array([(q * ijk[a]).sum() / q.sum() for a in range(3)])     # intensity-weighted centre, output index
    d_out, o_out = np.array(meta['geometry']['direction']), np.array(meta['geometry']['origin'])
    p_out = o_out + sum(c[a] * target * d_out[a] for a in range(3))
    _, hdr = I.read_nrrd(src)
    g_src = I.geometry(hdr)
    d_src, o_src = np.array(g_src['direction']), np.array(g_src['origin'])
    p_src = o_src + sum(mark[a] * sp[a] * d_src[a] for a in range(3))
    err = np.abs(p_out - p_src).max()
    assert err <= 0.05, f'output origin off by {err} mm'
    print(f'  output origin: marker at {np.round(p_out, 3).tolist()} (output) vs {np.round(p_src, 3).tolist()} (source), err {err:.3f} mm')


def _test_ingest_allowlist(tmp):
    rng = np.random.default_rng(2)
    arr = rng.integers(-500, 500, (21, 19, 15)).astype('int16')
    src = os.path.join(tmp, 'fixture.nrrd')
    _write_nrrd(src, arr, 'int16', extra=['patient_name:=SECRETVALUE', 'institution:=SECRETPLACE'])
    assert b'SECRETVALUE' in open(src, 'rb').read(), 'fixture lacks the secret'
    root = os.path.join(tmp, 'incoming')
    out = os.path.join(root, 'fixture-out')
    meta, real = I.ingest(src, 'FIXTURE', 0.3, out, root=root)
    assert set(meta) == {'source', 'geometry', 'source_dims', 'source_spacing_mm', 'values'}, 'meta keys'
    assert set(meta['geometry']) == {'dims', 'spacing_mm', 'direction', 'origin', 'space', 'dtype'}, 'geometry keys'
    blobs = []
    for dp, _, fs in os.walk(real):
        for f in fs:
            raw = open(os.path.join(dp, f), 'rb').read()
            blobs.append(raw)
            if f.endswith('.gz'):
                blobs.append(gzip.decompress(raw))
    assert len(blobs) == 3, 'expected meta.json and volume.i16.gz (and the gunzipped volume)'
    for blob in blobs:
        for word in (b'SECRETVALUE', b'SECRETPLACE', b'patient', b'institution'):
            assert word not in blob, f'{word!r} reached an output'
    vol = np.frombuffer(gzip.decompress(open(os.path.join(real, 'volume.i16.gz'), 'rb').read()), '<i2')
    assert vol.size == np.prod(meta['geometry']['dims']), 'volume size'
    print(f'  allowlist: no header key or value in {len(blobs)} output blobs')


def _test_out_refusal(tmp):
    src = os.path.join(tmp, 'refusal.nrrd')
    _write_nrrd(src, np.zeros((4, 4, 4), 'int16'), 'int16')
    root = os.path.join(tmp, 'refusal-incoming')   # not created: a refused path must stay absent
    for bad in (os.path.join(tmp, 'elsewhere'), os.path.join(root, '..', 'escape'), root):
        try:
            I.ingest(src, 'X', 0.3, bad, root=root)
        except ValueError:
            pass
        else:
            raise AssertionError(f'accepted out dir {bad}')
        assert not os.path.exists(os.path.realpath(bad)), 'refused dir was created'
    # the real incoming/ folder: the default root refuses a folder outside it, and the CLI exits non-zero
    cli = subprocess.run([sys.executable, '-I', I.__file__, src, '--source', 'X', '--spacing', '0.3',
                          '--out', os.path.join(tmp, 'cli-out')], capture_output=True, text=True)
    assert cli.returncode != 0 and 'inside' in cli.stderr, 'CLI accepted an out dir outside incoming/'
    assert not os.path.exists(os.path.join(tmp, 'cli-out')), 'CLI created the refused dir'
    print('  out-dir refusal: outside, traversal, incoming root itself, and CLI exit')


def _test_segments(tmp):
    lay = np.zeros((3, 6, 5, 4), np.uint8)       # 4D: layer axis first, space direction none
    lay[0, :3] = 1
    lay[2, 3:, 2:, 1:] = 1
    path = os.path.join(tmp, 'seg4d.seg.nrrd')
    _write_nrrd(path, lay, 'uchar', dirs='none (0.5,0,0) (0,0.5,0) (0,0,0.5)',
                extra=['Segment0_Name:=Liver', 'Segment0_Layer:=0', 'Segment1_Name:=Spleen', 'Segment1_Layer:=2'])
    got = I.read_segments(path)
    assert list(got) == ['Liver', 'Spleen'], 'segment names'
    assert np.array_equal(got['Liver'], lay[0] > 0) and np.array_equal(got['Spleen'], lay[2] > 0), '4D masks'
    lab = np.zeros((6, 5, 4), np.uint8)          # 3D labelmap with LabelValue
    lab[0:2] = 1
    lab[3:5] = 2
    path3 = os.path.join(tmp, 'seg3d.seg.nrrd')
    _write_nrrd(path3, lab, 'uchar', extra=['Segment0_Name:=Core', 'Segment0_LabelValue:=1',
                                           'Segment1_Name:=Shell', 'Segment1_LabelValue:=2'])
    got3 = I.read_segments(path3)
    assert np.array_equal(got3['Core'], lab == 1) and np.array_equal(got3['Shell'], lab == 2), '3D masks'
    print('  read_segments: 4D layer masks and 3D labelmap masks by name')


def _test_segments_4d_defaults(tmp):
    lay = np.zeros((3, 6, 5, 4), np.uint8)       # old Slicer 4D: one 0/1 layer per segment, no Layer or LabelValue keys
    lay[0, :3] = 1
    lay[1, 3:, 2:, 1:] = 1
    lay[2, :, :, :2] = 1
    path = os.path.join(tmp, 'seg4d-defaults.seg.nrrd')
    names = ['Liver', 'Spleen', 'Kidney']
    _write_nrrd(path, lay, 'uchar', dirs='none (0.5,0,0) (0,0.5,0) (0,0,0.5)',
                extra=[f'Segment{n}_Name:={name}' for n, name in enumerate(names)])
    got = I.read_segments(path)
    assert list(got) == names, 'segment names'
    for n, name in enumerate(names):
        assert np.array_equal(got[name], lay[n] == 1), f'{name} is not layer {n}'
    print('  read_segments 4D defaults: segment N read from layer N, label 1')


def _test_segments_shared_layer(tmp):
    lay = np.zeros((1, 6, 5, 4), np.uint8)       # one layer holding two segments, told apart by LabelValue
    lay[0, :3] = 1
    lay[0, 3:, 2:] = 2
    path = os.path.join(tmp, 'seg4d-shared.seg.nrrd')
    _write_nrrd(path, lay, 'uchar', dirs='none (0.5,0,0) (0,0.5,0) (0,0,0.5)',
                extra=['Segment0_Name:=A', 'Segment0_Layer:=0', 'Segment0_LabelValue:=1',
                       'Segment1_Name:=B', 'Segment1_Layer:=0', 'Segment1_LabelValue:=2'])
    got = I.read_segments(path)
    a, b = got['A'], got['B']
    assert np.array_equal(a, lay[0] == 1) and np.array_equal(b, lay[0] == 2), 'masks are not == LabelValue'
    assert not np.array_equal(a, b), 'two segments in one layer gave equal masks'
    assert not np.array_equal(a, lay[0] > 0) and not np.array_equal(b, lay[0] > 0), 'mask is layer > 0'
    print('  read_segments 4D shared layer: masks split by LabelValue')


def _test_space(tmp):
    arr = np.zeros((4, 4, 4), 'int16')
    for value, want in [('RAS', 'right-anterior-superior'), ('lps', 'left-posterior-superior'),
                        ('Right-Posterior-Superior', 'right-posterior-superior')]:
        path = os.path.join(tmp, 'space-ok.nrrd')
        _write_nrrd(path, arr, 'int16', extra=[f'space: {value}'])
        _, header = I.read_nrrd(path)
        assert I.geometry(header)['space'] == want, f'{value} did not normalise to {want}'
    src = os.path.join(tmp, 'space-bad.nrrd')
    _write_nrrd(src, arr, 'int16', extra=['space: SECRETSPACE'])
    root = os.path.join(tmp, 'space-incoming')
    out = os.path.join(root, 'x')
    try:
        I.ingest(src, 'X', 0.3, out, root=root)
    except ValueError as e:
        assert 'SECRETSPACE' not in str(e), 'refusal message echoes the space value'
    else:
        raise AssertionError('accepted a space outside the closed vocabulary')
    assert not os.path.exists(out), 'refused space still created an output folder'
    print('  space: short and long forms normalise; SECRETSPACE refused and not echoed')


def ingest_tests():
    print('ingest (WP B3):')
    with tempfile.TemporaryDirectory() as tmp:
        _test_nrrd_round_trip(tmp)
        _test_resample(tmp)
        _test_ingest_allowlist(tmp)
        _test_out_refusal(tmp)
        _test_segments(tmp)
        _test_segments_4d_defaults(tmp)
        _test_segments_shared_layer(tmp)
        _test_space(tmp)


def _test_kabsch(tmp):
    from scipy.spatial.transform import Rotation
    ref = np.array([[0, 0, 0], [10, 0, 0], [0, 8, 0], [0, 0, 6], [3, 4, 5]], float)     # non-coplanar
    r_true = Rotation.from_rotvec([0.3, -0.5, 0.8]).as_matrix()
    t = np.array([5, -3, 12.0])
    src = ref @ r_true.T + t                                  # src = R_true ref + t
    r, rms = F.kabsch(src, ref)
    assert np.abs(r - r_true.T).max() < 1e-6, 'recovered rotation differs'
    assert rms < 1e-9, 'proper fit residual'
    got = (src - src.mean(0)) @ r.T + ref.mean(0)
    assert np.abs(got - ref).max() < 1e-6, 'transformed points miss the reference'
    mirror = ref * np.array([-1.0, 1.0, 1.0])                 # mirrored source: no proper rotation can match it
    _, rms_p = F.kabsch(mirror, ref)
    _, rms_r = F.kabsch(mirror, ref, reflect=True)
    assert rms_r < 1e-6 and rms_p > 0.5, f'mirror: proper {rms_p} reflected {rms_r}'
    print(f'  kabsch: recovered R to {np.abs(r - r_true.T).max():.1e}; mirror proper rms {rms_p:.2f}, reflected {rms_r:.1e}')


def _test_footplate(tmp):
    pts = np.array([(x, y, z) for x in np.linspace(0, 4, 41) for y in (-0.2, 0, 0.2) for z in (-0.2, 0, 0.2)])
    o, info = F.footplate_origin(pts, np.array([10.0, 0, 0]))     # incus beyond the x = 4 end
    assert o[0] < 0.5 and info['footplate_end'] == 'low', f'far end (x=0) not picked: {o}'
    o2, _ = F.footplate_origin(pts, np.array([-10.0, 0, 0]))     # incus beyond the x = 0 end
    assert o2[0] > 3.5, f'far end (x=4) not picked: {o2}'
    print(f'  footplate: origin {np.round(o, 3).tolist()} with incus at +x, {np.round(o2, 3).tolist()} at -x')


def _test_lps_to_ras(tmp):
    arr = np.zeros((5, 5, 5), 'int16')
    path = os.path.join(tmp, 'lps.nrrd')
    _write_nrrd(path, arr, 'int16', dirs='(0.5,0,0) (0,0.5,0) (0,0,0.5)', origin='(10,20,30)')
    geo = I.geometry(I.read_nrrd(path)[1])
    got = F.grid_to_ras(geo, [[2, 4, 6]])[0]
    assert np.allclose(got, [-11, -22, 33]), f'LPS to RAS gave {got}'
    assert np.allclose(F.ras_to_grid(geo, [got])[0], [2, 4, 6]), 'inverse'
    las = os.path.join(tmp, 'las.nrrd')
    _write_nrrd(las, arr, 'int16', dirs='(0.5,0,0) (0,0.5,0) (0,0,0.5)', extra=['space: left-anterior-superior'])
    try:
        F.grid_to_ras(I.geometry(I.read_nrrd(las)[1]), [[0, 0, 0]])
    except ValueError:
        pass
    else:
        raise AssertionError('LAS accepted')
    print(f'  LPS to RAS: index (2,4,6) -> {got.tolist()} mm; LAS refused')


def frame_tests():
    print('frame (WP B4):')
    with tempfile.TemporaryDirectory() as tmp:
        _test_kabsch(tmp)
        _test_footplate(tmp)
        _test_lps_to_ras(tmp)


def main():
    meta = json.load(open(os.path.join(OUT, 'ct', 'ct.json')))
    nx, ny, nz = meta['dims']
    raw = gzip.open(os.path.join(OUT, 'ct', 'ct.u8.gz')).read()
    assert len(raw) == nx * ny * nz, 'ct.u8.gz size disagrees with dims'
    V = np.frombuffer(raw, np.uint8).reshape(nz, ny, nx).astype(np.float32)
    # SSB's ct.json v1 header (js/ssb/volume.js parseHeader): the affine is a 0.3 mm scale plus the box origin
    assert meta['version'] == 1 and meta['dtype'] == 'uint8' and meta['values']['kind'] == 'display', 'header keys'
    A = np.array(meta['affine'], float)
    h = meta['spacing'][0]; o = A[:3, 3]
    assert list(meta['spacing']) == [h, h, h] and np.allclose(A[:3, :3], np.diag([h, h, h])), 'affine is not a scale plus origin'
    assert abs(h - 0.3) < 1e-9 and meta['frame'].startswith('OLSB')
    assert (o < 0).all() or o[2] < 0, 'origin box'
    ext = o + np.array([nx, ny, nz]) * h
    assert (o[0] < 0 < ext[0]) and (o[1] < 0 < ext[1]) and (o[2] < 0 < ext[2]), 'oval-window origin outside the volume'
    src = np.frombuffer(gzip.open(os.path.join(OUT, 'ct', 'source.u8.gz')).read(), np.uint8).reshape(nz, ny, nx)
    assert src.shape == V.shape
    cov = src > 0     # voxels with data (the rest of the box is 0)
    fa = (V[cov] < 60).mean(); fs = ((V[cov] > 80) & (V[cov] < 150)).mean(); fb = (V[cov] > 200).mean()
    print(f'volume {nx}x{ny}x{nz} at {h} mm; fractions: air {fa:.2f} soft {fs:.2f} bone {fb:.2f}')
    assert fa > 0.03 and fs > 0.2 and fb > 0.02, 'level mix implausible'
    lm = json.load(open(os.path.join(OUT, 'geometry', 'landmarks.json')))['landmarks']
    g = np.arange(-0.9, 0.9 + 1e-6, 0.3)
    off = np.array([(x, y, z) for x in g for y in g for z in g if x * x + y * y + z * z <= 0.81])
    def rates(shift):
        stats = {'air': [0, 0], 'soft': [0, 0], 'bone': [0, 0]}
        bad = []
        for r in lm:
            nm = r['name']
            cls = 'air' if nm in AIR else 'soft' if nm in SOFT else 'bone' if nm in BONE else None
            if cls is None:
                continue
            P = np.array(r['point_mm']) + shift + off
            i = np.round((P - o) / h).astype(int)
            ok = ((i >= 0) & (i < [nx, ny, nz])).all(1)
            if not ok.any():
                continue
            v = V[i[ok, 2], i[ok, 1], i[ok, 0]]
            hit = (v < 60).any() if cls == 'air' else ((v > 80) & (v < 150)).any() if cls == 'soft' else (v > 200).any()
            stats[cls][0] += int(hit); stats[cls][1] += 1
            if not hit:
                bad.append((nm, r['plane'], r['slices'], r['point_mm']))
        return stats, bad
    stats, bad = rates(np.zeros(3))
    ctrl, _ = rates(np.array([7.0, -7.0, 7.0]))
    print('  control (every tip shifted 7 mm): ' + ', '.join(f'{c} {a}/{n}' for c, (a, n) in ctrl.items()))
    for c, (a, n) in stats.items():
        print(f'  {c:5s} tips on matching tissue: {a}/{n} = {a / max(n, 1):.2f} (floor {FLOOR[c]})')
    for c, (a, n) in stats.items():
        assert n > 0 and a / n >= FLOOR[c], f'{c} landmarks do not land on {c}'
    ingest_tests()
    frame_tests()
    print('selftest OK')


if __name__ == '__main__':
    main()
