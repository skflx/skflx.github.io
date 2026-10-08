"""Reference specimen, stage D: the open airway lining (ST1b).

    .venv/bin/python tools/ssb-pipeline/uw/lining.py     # after meshes.py (and softtissue.py: both edit packs.json)

Why. meshes.py meshes every air compartment as its own closed surface, so where two compartments meet
(the choanae, the sphenoid and frontal ostia, the maxillary ostium, the cleft) there is a double
membrane: drawn as opaque mucosa from inside it seals the opening and the scope cannot look through.
This stage meshes the UNION of every air-space label once. An air | air interface is interior to the
union, so it carries no surface; an opening is open.

Reads only ssb/ (ct.json, labels.u16.gz, geometry/labels.json), as the other stage-D scripts do.

Method. Marching cubes on the union mask at meshes.py's level, sigma, step and Taubin rules, then
decimated to LINING_BUDGET triangles in one piece (so the nodes below share their cut vertices and
shading is continuous across them). Each triangle is then given to the label of the first air voxel
along its inward normal (the normals point out of the air, into the tissue): the node is named
<id>.<side> after that label, so picking from inside returns graph ids. Writes ssb/models/lining.glb.gz
and lists it in packs.json as the pack "lining" with "lining": true (its node names repeat the air
packs' on purpose; the viewer keys them apart and draws them instead of the air shells when the
mucosa layer is seen from within, docs/ssb.md 5.7).

Checked here and asserted: no triangle centroid lies within 0.5 mm of an air | air label interface
unless it is within 1 mm of tissue (count 0), and the budgets hold.
"""
import json, os, sys
import numpy as np
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import meshes as M  # noqa: E402
from volume import write_results  # noqa: E402

REPO = M.REPO
LINING_BUDGET = 50000          # triangles in all (the air shells it replaces from inside total ~100k; docs/ssb.md 5.4: 400k loaded)
LINING_BYTES = 1_500_000
PROBE_MM = (0.5, 1.0, 1.5, 2.0, 3.0)   # how far along the inward normal to look for the air voxel a triangle faces
INTERFACE_MM = 0.5
TISSUE_MM = 1.0


def air_label_ids(table):
    return [int(k) for k, v in table.items() if v.rsplit('.', 1)[0] in M.AIR_PACKED]


def ras_to_index(aff, pts):
    """RAS mm (N, 3) -> integer (k, j, i) voxel indices into lab[k, j, i]."""
    A = np.array(aff)
    ijk = (pts - A[:3, 3]) @ np.linalg.inv(A[:3, :3]).T
    return np.rint(ijk[:, ::-1]).astype(int)


def clip(idx, shape):
    return np.stack([np.clip(idx[:, n], 0, shape[n] - 1) for n in range(3)], 1)


def facing_labels(v, f, nrm, lab, air, aff):
    """Per triangle, the label of the first air voxel along the inward normal; the second return is how
    many triangles found none within the probe range and took the nearest air voxel's label."""
    cen = v[f].mean(1)
    tn = nrm[f].mean(1)
    tn /= np.maximum(np.linalg.norm(tn, axis=1, keepdims=True), 1e-12)
    out = np.zeros(len(f), lab.dtype)
    todo = np.ones(len(f), bool)
    for d in PROBE_MM:
        if not todo.any():
            break
        idx = clip(ras_to_index(aff, cen[todo] - tn[todo] * d), lab.shape)
        hit = air[idx[:, 0], idx[:, 1], idx[:, 2]]
        sel = np.flatnonzero(todo)[hit]
        out[sel] = lab[idx[hit, 0], idx[hit, 1], idx[hit, 2]]
        todo[sel] = False
    left = int(todo.sum())
    if left:
        near = ndi.distance_transform_edt(~air, return_indices=True)[1]
        idx = clip(ras_to_index(aff, cen[todo]), lab.shape)
        k, j, i = near[0][idx[:, 0], idx[:, 1], idx[:, 2]], near[1][idx[:, 0], idx[:, 1], idx[:, 2]], near[2][idx[:, 0], idx[:, 1], idx[:, 2]]
        out[todo] = lab[k, j, i]
    return out, left


def subset(v, f, n, keep):
    """The triangles `keep` of (v, f) as their own mesh, vertices reindexed, normals carried over."""
    ff = f[keep]
    used, inv = np.unique(ff, return_inverse=True)
    return v[used], inv.reshape(ff.shape), n[used]


def interface_check(v, f, lab, air, aff, spacing):
    """Count the triangles whose centroid is within INTERFACE_MM of an air | air label interface and
    farther than TISSUE_MM from tissue (a surface there would be a membrane across an opening)."""
    pad = np.pad(lab, 1, mode='edge')
    core = (slice(1, -1),) * 3
    diff = np.zeros(lab.shape, bool)
    for ax in range(3):
        for s in (-1, 1):
            sl = [slice(1, -1)] * 3
            sl[ax] = slice(1 + s, pad.shape[ax] - 1 + s)
            nb = pad[tuple(sl)]
            diff |= (nb != lab) & air & np.isin(nb, np.unique(lab[air]))
    d_if = ndi.distance_transform_edt(~diff, sampling=spacing)
    d_tis = ndi.distance_transform_edt(air, sampling=spacing)
    idx = clip(ras_to_index(aff, v[f].mean(1)), lab.shape)
    di = d_if[idx[:, 0], idx[:, 1], idx[:, 2]]
    dt = d_tis[idx[:, 0], idx[:, 1], idx[:, 2]]
    return int(((di <= INTERFACE_MM) & (dt > TISSUE_MM)).sum())


def build_lining(lab, table, aff, spacing, budget):
    """The lining of the air in `lab`: [(node name, verts, faces, normals)] split by the label each triangle
    faces, and the report {union, fallback, bad}. Asserts the membrane check, as the base lining does."""
    ids = air_label_ids(table)
    air = np.isin(lab, ids)
    v, f, nrm = M.build(air, aff, budget)
    face_lab, fallback = facing_labels(v, f, nrm, lab, air, aff)
    bad = interface_check(v, f, lab, air, aff, (spacing,) * 3)
    assert bad == 0, 'the lining has a membrane across an opening'
    items = []
    for idx in sorted(set(int(x) for x in np.unique(face_lab)) - {0}):
        sv, sf, sn = subset(v, f, nrm, face_lab == idx)
        items.append((table[str(idx)], sv, sf, sn))
    return items, {'air': int(air.sum()), 'labels': len(ids), 'union': (len(v), len(f)), 'fallback': fallback, 'bad': bad}


def main():
    hdr, ct, lab, table = M.read_volume()
    aff, spacing = hdr['affine'], hdr['spacing'][0]
    items, rep = build_lining(lab, table, aff, spacing, LINING_BUDGET)
    print('air voxels', rep['air'], 'labels', rep['labels'])
    print('union surface: %d triangles, %d vertices' % (rep['union'][1], rep['union'][0]))
    fallback, bad = rep['fallback'], rep['bad']
    print('triangles with no air voxel within %.1f mm along the normal (took the nearest air label): %d' % (PROBE_MM[-1], fallback))
    print('triangle centroids within %.1f mm of an air|air interface and over %.1f mm from tissue: %d' % (INTERFACE_MM, TISSUE_MM, bad))
    for name, _, f_, _ in items:
        print('  %-34s %6d triangles' % (name, len(f_)))
    out = os.path.join(REPO, 'ssb/models/lining.glb.gz')
    raw, gz = M.write_glb(out, items)
    tris = int(sum(len(f_) for _, _, f_, _ in items))
    assert tris <= LINING_BUDGET + 50 and gz <= LINING_BYTES, 'the lining breaks its budget: %d triangles, %d bytes' % (tris, gz)

    entry = {'file': 'lining.glb.gz', 'lining': True, 'bytes': gz, 'bytes_uncompressed': raw, 'triangles': tris,
             'nodes': {k: {'triangles': int(len(f_)), 'vertices': int(len(v_))} for k, v_, f_, _ in items}}
    pj = os.path.join(REPO, 'ssb/models/packs.json')
    man = json.load(open(pj))
    man['packs']['lining'] = entry
    man.setdefault('notes', {})['lining'] = ('the open airway lining (tools/ssb-pipeline/uw/lining.py): one surface over the union of every air-space '
                                             'label, split into nodes by the air label each triangle faces. Node names repeat the air packs\' '
                                             'because it is the same lining with the openings open; the viewer draws it instead of the per-compartment shells '
                                             'when the mucosa layer is seen from within (the outside view, the CT overlay and picking by id are unchanged).')
    man['totals'] = {'bytes': int(sum(p['bytes'] for p in man['packs'].values())),
                     'triangles': int(sum(p['triangles'] for p in man['packs'].values()))}
    json.dump(man, open(pj, 'w'), indent=1)
    write_results('lining', {'triangles': tris, 'bytes': gz, 'fallback_triangles': fallback, 'membrane_triangles': bad,
                             'nodes': {k: int(len(f_)) for k, _, f_, _ in items}})
    print('lining pack: %d bytes, %d triangles; all packs %s' % (gz, tris, json.dumps(man['totals'])))


if __name__ == '__main__':
    main()
