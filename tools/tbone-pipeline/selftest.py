"""Self-test of the committed temporal-bone data (WP T2): numpy + stdlib only, no UW images needed.

    python3 -I tools/tbone-pipeline/selftest.py     (numpy required)

Asserts: ct.json dims/spacing agree with the byte count of ct.u8.gz and the oval-window origin lies
inside the box; the volume has air, soft-tissue and bone levels in plausible proportions; and UW's labelled
landmarks land on matching tissue: for each tip whose structure has a known tissue class (air: middle-ear
and mastoid air spaces, canal; fluid / soft tissue: vestibule, cochlea, IAC; bone: mastoid tip,
clivus, ...) the 0.9 mm neighbourhood of the tip must contain that class (air: a level < 60; soft: a level
in 80-150; bone: a level > 200). Arrows touch the edge of a structure, so a neighbourhood and not the
single voxel is read. Pass rates are printed; the assertion floors are stated below.
"""
import gzip, json, os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'tbone')

AIR = {'epitympanum', 'hypotympanum', 'aditus', 'mastoid-antrum', 'eac', 'eustachian-tube-entrance', 'facial-recess',
       'prussaks-space'}
SOFT = {'vestibule', 'cochlea', 'basal-turn', 'middle-turn', 'apical-turn', 'iac', 'modiolus'}
BONE = {'scutum', 'mastoid-tip', 'clivus', 'petrous-apex', 'tegmen-tympani', 'pyramidal-eminence', 'promontory', 'koerners-septum'}
# floors sit just under the rates measured on this data (tips are placed on a structure's edge and the capture is
# blurred over ~0.7 mm, so a rate well below 1 is the label precision, not a failure); they catch a gross misplacement
# of the whole frame (a wrong origin, flipped axis or scale), which drops every rate to chance
FLOOR = {'air': 0.55, 'soft': 0.55, 'bone': 0.55}


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
    print('selftest OK')


if __name__ == '__main__':
    main()
