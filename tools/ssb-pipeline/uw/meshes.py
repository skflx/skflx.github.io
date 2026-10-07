"""Reference specimen, stage B: surfaces of the named air spaces and the bony envelope.

    .venv/bin/python tools/ssb-pipeline/uw/meshes.py [--png-dir DIR]     # after specimen.py

Reads the committed volume (ssb/ct/ct.u8.gz, labels.u16.gz, ct.json, ssb/geometry/labels.json)
so the meshes can never drift from what CT mode shows. Per structure: marching cubes on the
lightly blurred mask, Taubin smoothing (volume-preserving; stands in for windowed-sinc),
quadric decimation (fast-simplification) to a per-kind triangle budget, area-weighted normals.

Writes ssb/models/<pack>.glb.gz and ssb/models/packs.json. Geometry only: no materials, no
textures. Positions are RAS millimetres (docs/ssb.md section 4: nothing in ssb/ stores scene
coordinates); the viewer applies rasToScene at the root, as the dioramas do. Quantized per
KHR_mesh_quantization: int16 positions dequantized by each node's translation/scale, int8
normals. Written by hand (no glTF toolchain needed); gzip with mtime 0 so reruns are byte-stable.
"""
import argparse, gzip, json, os, struct, sys
import numpy as np
from scipy import ndimage as ndi, sparse
from skimage.measure import marching_cubes
import fast_simplification

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from volume import CACHE, read_results, write_results  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
BONE_ID = 's.skull-base-region.M'      # PROPOSED id (not in the graph yet): the bony envelope of the crop
BONE_LEVEL = 150                        # display (~ +650 HU)
PACKS = {
    'core': ['s.nasal-cavity', 's.nasal-vestibule', 's.nasopharynx', 's.maxillary-sinus', 's.skull-base-region'],
    'ethmoid-frontal': ['s.frontal-sinus', 's.frontal-recess', 's.agger-nasi-cell', 's.ethmoid-bulla',
                        's.anterior-ethmoid-cells', 's.posterior-ethmoid-cells'],
    'sphenoid-sellar': ['s.sphenoid-sinus'],
    # stage C (walls.py): bone resection units, septum, turbinates, and the orbital contents they face
    'walls': ['s.lamina-papyracea', 's.orbital-floor', 's.maxillary-medial-wall', 's.maxillary-anterior-wall',
              's.maxillary-posterior-wall', 's.maxillary-sinus-floor', 's.nasal-floor', 's.basal-lamella',
              's.lateral-lamella', 's.fovea-ethmoidalis', 's.cribriform-plate', 's.frontal-sinus-anterior-table',
              's.frontal-sinus-posterior-table', 's.frontal-sinus-floor', 's.intersinus-septum',
              's.frontal-intersinus-septum', 's.sphenoid-face', 's.sphenoid-floor', 's.planum-sphenoidale',
              's.sella-turcica', 's.clivus', 's.sphenoid-lateral-wall', 's.nasal-septum', 's.inferior-turbinate',
              's.middle-turbinate', 's.orbit'],
}
AIR_PACKED = {c for p in ('core', 'ethmoid-frontal', 'sphenoid-sellar') for c in PACKS[p]} - {'s.skull-base-region'}
# thin plates (walls.py writes them one or two voxels thick): a lower iso-level keeps them closed
THIN = set(PACKS['walls']) - {'s.nasal-septum', 's.inferior-turbinate', 's.middle-turbinate', 's.orbit'}
WALL_BUDGET = {'s.nasal-septum': 6000, 's.inferior-turbinate': 4000, 's.middle-turbinate': 3500, 's.orbit': 3000,
               's.maxillary-anterior-wall': 3000, 's.frontal-sinus-anterior-table': 2500,
               's.frontal-sinus-posterior-table': 2500}
# the material kind a node is drawn as when its graph kind is not it (node extras.kind; ST6): the vestibule is lined with
# skin, not mucosa, and the external nose is skin
KIND = {'s.nasal-vestibule': 'skin', 's.external-nose': 'skin'}
# triangle budget per node (docs/ssb.md section 5.4: <= 400k on screen in total)
BUDGET = {'s.skull-base-region': 110000, 's.nasal-cavity': 12000, 's.nasal-vestibule': 3000, 's.maxillary-sinus': 8000, 's.nasopharynx': 6000,
          's.sphenoid-sinus': 7000, 's.anterior-ethmoid-cells': 5000, 's.posterior-ethmoid-cells': 5000,
          's.frontal-sinus': 3000, 's.frontal-recess': 2500, 's.agger-nasi-cell': 1200, 's.ethmoid-bulla': 1500}


def read_volume():
    hdr = json.load(open(os.path.join(REPO, 'ssb/ct/ct.json')))
    nx, ny, nz = hdr['dims']
    ct = np.frombuffer(gzip.open(os.path.join(REPO, 'ssb/ct/ct.u8.gz')).read(), np.uint8).reshape(nz, ny, nx)
    lab = np.frombuffer(gzip.open(os.path.join(REPO, 'ssb/ct/labels.u16.gz')).read(), '<u2').reshape(nz, ny, nx)
    table = json.load(open(os.path.join(REPO, 'ssb/geometry/labels.json')))['labels']
    return hdr, ct, lab, table


def surface(mask, aff, sigma=0.75, step=1, level=0.5):
    f = ndi.gaussian_filter(mask.astype(np.float32), sigma)
    v, faces, _, _ = marching_cubes(np.pad(f, 2), level, step_size=step, allow_degenerate=False)
    v -= 2
    kji = v
    ijk = kji[:, ::-1]                                   # (i, j, k)
    ras = ijk @ np.array(aff)[:3, :3].T + np.array(aff)[:3, 3]
    return ras, faces                                   # outward winding (checked on a ball: skimage's order + the axis swap)


def taubin(v, f, it=12, lam=0.5, mu=-0.53):
    n = len(v)
    e = np.concatenate([f[:, [0, 1]], f[:, [1, 2]], f[:, [2, 0]]])
    e = np.concatenate([e, e[:, ::-1]])
    W = sparse.coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(n, n)).tocsr()
    W.data[:] = 1.0
    deg = np.asarray(W.sum(1)).ravel(); deg[deg == 0] = 1
    for _ in range(it):
        for c in (lam, mu):
            v = v + c * (W @ v / deg[:, None] - v)
    return v


def normals(v, f):
    fn = np.cross(v[f[:, 1]] - v[f[:, 0]], v[f[:, 2]] - v[f[:, 0]])
    vn = np.zeros_like(v)
    for c in range(3):
        np.add.at(vn, f[:, c], fn)
    return vn / np.maximum(np.linalg.norm(vn, axis=1, keepdims=True), 1e-12)


def build(mask, aff, budget, step=1, sigma=0.75, level=0.5):
    v, f = surface(mask, aff, sigma, step, level)
    v = taubin(v, f)
    if len(f) > budget:
        v, f = fast_simplification.simplify(v.astype(np.float32), f.astype(np.int32), 1 - budget / len(f))
    v = np.asarray(v, np.float64); f = np.asarray(f, np.int64)
    return v, f, normals(v, f)


# ---------------------------------------------------------------- glb
def write_glb(path, meshes):
    """meshes: [(name, verts RAS mm float (N,3), faces (M,3), normals (N,3))]."""
    bin_parts, views, accessors, gl_meshes, nodes = [], [], [], [], []
    offset = 0

    def add_view(data, stride=None, target=None):
        nonlocal offset
        pad = (-offset) % 4
        if pad:
            bin_parts.append(b'\0' * pad); offset += pad
        bv = {'buffer': 0, 'byteOffset': offset, 'byteLength': len(data)}
        if stride:
            bv['byteStride'] = stride
        if target:
            bv['target'] = target
        bin_parts.append(data); offset += len(data)
        views.append(bv)
        return len(views) - 1
    for name, v, f, n in meshes:
        lo, hi = v.min(0), v.max(0)
        scale = np.maximum(hi - lo, 1e-6) / 65535.0
        q = np.round((v - lo) / scale - 32768).astype(np.int16)
        pos = np.zeros((len(v), 4), np.int16); pos[:, :3] = q          # stride 8 (4-byte aligned)
        nb = np.zeros((len(v), 4), np.int8); nb[:, :3] = np.round(n * 127).astype(np.int8)
        idx_type, idx_dtype = (5123, np.uint16) if len(v) < 65536 else (5125, np.uint32)
        vp = add_view(pos.tobytes(), 8, 34962)
        vn = add_view(nb.tobytes(), 4, 34962)
        vi = add_view(f.astype(idx_dtype).ravel().tobytes(), None, 34963)
        accessors.append({'bufferView': vp, 'componentType': 5122, 'count': len(v), 'type': 'VEC3',
                          'min': [int(x) for x in q.min(0)], 'max': [int(x) for x in q.max(0)]})
        accessors.append({'bufferView': vn, 'componentType': 5120, 'normalized': True, 'count': len(v), 'type': 'VEC3'})
        accessors.append({'bufferView': vi, 'componentType': idx_type, 'count': int(f.size), 'type': 'SCALAR'})
        a0 = len(accessors) - 3
        gl_meshes.append({'name': name, 'primitives': [{'attributes': {'POSITION': a0, 'NORMAL': a0 + 1},
                                                        'indices': a0 + 2, 'mode': 4}]})
        # three's GLTFLoader strips '.' from object names; extras land in userData intact
        cid, side = name.rsplit('.', 1)
        extras = {'id': cid, 'side': side, 'name': name}
        if cid in KIND:
            extras['kind'] = KIND[cid]
        nodes.append({'name': name, 'mesh': len(gl_meshes) - 1, 'extras': extras,
                      'translation': [float(x) for x in lo + 32768 * scale], 'scale': [float(x) for x in scale]})
    binary = b''.join(bin_parts)
    binary += b'\0' * ((-len(binary)) % 4)
    doc = {'asset': {'version': '2.0', 'generator': 'tools/ssb-pipeline/uw/meshes.py'},
           'extensionsUsed': ['KHR_mesh_quantization'], 'extensionsRequired': ['KHR_mesh_quantization'],
           'scene': 0, 'scenes': [{'nodes': list(range(len(nodes)))}], 'nodes': nodes, 'meshes': gl_meshes,
           'accessors': accessors, 'bufferViews': views, 'buffers': [{'byteLength': len(binary)}]}
    js = json.dumps(doc, separators=(',', ':')).encode()
    js += b' ' * ((-len(js)) % 4)
    glb = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binary))
    glb += struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(binary), 0x004E4942) + binary
    with gzip.GzipFile(path, 'wb', compresslevel=9, mtime=0) as fh:
        fh.write(glb)
    return len(glb), os.path.getsize(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--png-dir', default=CACHE)
    args = ap.parse_args()
    hdr, ct, lab, table = read_volume()
    aff = hdr['affine']
    built = {}
    for idx, name in table.items():
        cid = name.rsplit('.', 1)[0]
        m = lab == int(idx)
        if m.sum() < 50:
            continue
        if cid in THIN:
            built[name] = build(m, aff, WALL_BUDGET.get(cid, 2000), sigma=0.6, level=0.3)
        else:
            built[name] = build(m, aff, BUDGET.get(cid, WALL_BUDGET.get(cid, 3000)))
        print(name, 'tris', len(built[name][1]), flush=True)
    # bony envelope: bone within 12 mm of the named air spaces (the sinus skeleton, not the
    # calvaria the crop box also cuts), specks removed, 1 mm marching cubes
    air_ids = [int(k) for k, v in table.items() if v.rsplit('.', 1)[0] in AIR_PACKED]
    near = ndi.distance_transform_edt(~np.isin(lab, air_ids), sampling=hdr['spacing'][0]) <= 12.0
    bone = (ct >= BONE_LEVEL) & near
    cl, n = ndi.label(bone)
    sizes = np.bincount(cl.ravel()); keep = sizes >= 400; keep[0] = False
    bone = keep[cl]
    built[BONE_ID] = build(bone, aff, BUDGET['s.skull-base-region'], step=2, sigma=0.6)
    print(BONE_ID, 'tris', len(built[BONE_ID][1]), flush=True)

    os.makedirs(os.path.join(REPO, 'ssb/models'), exist_ok=True)
    packs = {}
    for pack, cids in PACKS.items():
        items = [(k, *built[k]) for k in sorted(built) if k.rsplit('.', 1)[0] in cids]
        if not items:
            continue
        raw, gz = write_glb(os.path.join(REPO, f'ssb/models/{pack}.glb.gz'), items)
        packs[pack] = {'file': f'{pack}.glb.gz', 'bytes': gz, 'bytes_uncompressed': raw,
                       'triangles': int(sum(len(f) for _, _, f, _ in items)),
                       'nodes': {k: {'triangles': int(len(f)), 'vertices': int(len(v))} for k, v, f, _ in items}}
    manifest = {
        'version': 1,
        'specimen': 'uw-axial-sagittal',
        'frame': 'RAS millimetres (docs/ssb.md section 4); apply rasToScene at the root, as the dioramas do',
        'encoding': 'glTF 2.0 binary, gzip; KHR_mesh_quantization: int16 POSITION dequantized by each node\'s '
                    'translation/scale, int8 normalized NORMAL; no materials, no textures',
        'nodeNames': '<graph id>.<side>; node extras {id, side, name} (three.js strips dots from object names, '
                     'so read userData.id / userData.side)',
        'notes': {'walls': 'stage C resection units (tools/ssb-pipeline/uw/walls.py): each is the bone two named '
                           'compartments share; several are proxies or orientation splits - the method per unit is in '
                           'tools/ssb-pipeline/uw/registration.json "walls.notes". s.orbit is the orbital soft tissue '
                           '(globe, fat, muscles) the walls face, not bone.'},
        'packs': packs,
        'totals': {'bytes': int(sum(p['bytes'] for p in packs.values())),
                   'triangles': int(sum(p['triangles'] for p in packs.values()))},
        'license': 'ssb/LICENSE-data.md',
    }
    json.dump(manifest, open(os.path.join(REPO, 'ssb/models/packs.json'), 'w'), indent=1)
    write_results('meshes', {k: {kk: vv for kk, vv in p.items() if kk != 'nodes'} for k, p in packs.items()})
    print(json.dumps(manifest['totals']), {k: (p['bytes'], p['triangles']) for k, p in packs.items()})
    render(built, args.png_dir)


def render(built, png_dir):
    """Offline check render (matplotlib, flat Lambert shading), three views."""
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from mpl_toolkits.mplot3d.art3d import Poly3DCollection
    rng = np.random.default_rng(3)
    walls = set(PACKS['walls'])
    names = sorted(k for k in built if k != BONE_ID and k.rsplit('.', 1)[0] not in walls)
    wnames = sorted(k for k in built if k.rsplit('.', 1)[0] in walls and not k.startswith('s.orbit.'))
    cols = {k: rng.uniform(0.25, 0.95, 3) for k in names + wnames}
    light = np.array([0.4, 0.5, 0.75]); light /= np.linalg.norm(light)
    for tag, with_bone in (('air', False), ('bone', True), ('walls', None)):
        fig = plt.figure(figsize=(18, 6.4), dpi=110)
        for n, (elev, azim, title) in enumerate(((0, -90, 'anterior (RAS: from +A)'), (0, 180, 'left lateral'),
                                                 (90, -90, 'superior'))):
            ax = fig.add_subplot(1, 3, n + 1, projection='3d')
            items = ([(BONE_ID, np.array([0.85, 0.82, 0.72]))] if with_bone else
                     [(k, cols[k]) for k in (wnames if with_bone is None else names)])
            for k, c in items:
                v, f, nrm = built[k]
                fn = np.cross(v[f[:, 1]] - v[f[:, 0]], v[f[:, 2]] - v[f[:, 0]])
                fn /= np.maximum(np.linalg.norm(fn, axis=1, keepdims=True), 1e-12)
                shade = 0.35 + 0.65 * np.abs(fn @ light)
                pc = Poly3DCollection(v[f], facecolors=np.clip(c[None] * shade[:, None], 0, 1), linewidths=0)
                ax.add_collection3d(pc)
            ax.set_xlim(-52, 52); ax.set_ylim(-90, 22); ax.set_zlim(-16, 80)
            ax.set_box_aspect((104, 112, 96)); ax.view_init(elev=elev, azim=azim)
            ax.set_xlabel('R'); ax.set_ylabel('A'); ax.set_zlabel('S'); ax.set_title(title)
        if not with_bone:
            handles = [plt.Line2D([0], [0], marker='s', ls='', color=cols[k], label=k)
                       for k in (wnames if with_bone is None else names)]
            fig.legend(handles=handles, loc='lower center', ncol=6, fontsize=7)
        fig.savefig(os.path.join(png_dir, f'recon{"C" if tag == "walls" else "B"}-mesh-{tag}.png'), bbox_inches='tight')
        plt.close(fig)


if __name__ == '__main__':
    main()
