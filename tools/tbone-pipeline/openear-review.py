"""Review page for an OpenEar specimen in OLSB's frame (WP B4 review; spec plans/2026-11-04-tbone-sources.md; issue #301).

    python3 -I tools/tbone-pipeline/openear-review.py ZETA

Inputs, all under the git-ignored tools/tbone-pipeline/incoming/ (made by fetch_openear.py, ingest.py --spacing 0.3
--out incoming/zeta-0.3, frame.py --out incoming/zeta-frame, olsb-centroids.mjs > incoming/olsb-centroids.json;
incoming/olsb-labels.json is made here by olsb-labels.mjs if missing).
Output: incoming/review-<name>/index.html, one self-contained file (images as data: URIs, no script, no remote request),
plus the PNGs it embeds.

It shows (a) CT slices in OLSB's frame with the specimen's segmentation outlines (solid colour) and OLSB's procedural
model outlines (dashed), (b) the residual table, rotation conditioning and rules of frame.json, (c) an independent second
fit: the rotation fitted to the real-CT UW landmark medians (tbone/geometry/landmarks.json) instead of the procedural
model, both frames' residuals side by side and the angle between the two rotations, (d) the attribution.
Segment names are read for local use and written only as glossary ids. numpy, scipy, PIL.
"""
import argparse, base64, gzip, io, json, os, subprocess, sys
import numpy as np
from scipy import ndimage as ndi
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ingest as I  # noqa: E402
import frame as F  # noqa: E402

INC = os.path.join(HERE, 'incoming')
REPO = os.path.join(HERE, '..', '..')
ATTRIBUTION = ('Temporal bone CT derived from the OpenEar library (Sieber et al., Sci Data 2019, '
               'doi:10.1038/sdata.2018.297; data doi:10.5281/zenodo.1473724), CC BY 4.0; resampled and cropped.')
WINDOW = (-500.0, 2500.0)       # scanner grey values (not HU) -> 0..255
PX = 0.05                       # mm per pixel of every slice image
# plane: (horizontal axis, vertical axis, fixed axis, horizontal range, vertical range); x is drawn increasing to the
# left (radiological view: a right ear's lateral side on the left), y to the right in the sagittal, z and y upward
VIEWS = {
    'axial':    (0, 1, 2, (35, -25), (-30, 25)),
    'coronal':  (0, 2, 1, (35, -25), (-25, 25)),
    'sagittal': (1, 2, 0, (-30, 25), (-25, 25)),
}
AXN = 'xyz'
# structure -> (ZETA segments, OLSB glossary ids, colour)
STRUCT = [
    ('malleus', ('Malleus',), ('malleus',), (255, 200, 0)),
    ('incus', ('Incus',), ('incus',), (255, 120, 0)),
    ('stapes', ('Stapes',), ('stapes',), (255, 0, 80)),
    ('cochlea', ('Scala Tympani', 'Scala Vestibuli'), ('cochlea',), (0, 220, 255)),
    ('tm', ('Tympanic Membrane',), ('tm',), (255, 255, 255)),
    ('eac', ('External Auditory Canal',), ('eac',), (80, 255, 80)),
    ('fn', ('Facial Nerve',), ('fn', 'fn-meatal', 'fn-lab', 'geniculate', 'fn-tymp', 'genu2'), (255, 0, 255)),
    ('chorda', ('Chorda Tympani',), ('chorda',), (170, 110, 255)),
    ('cn8', ('Cochleovestibular nerve',), ('cn8',), (255, 160, 160)),
    ('ica', ('Carotis Interna',), ('ica',), (0, 130, 255)),
    ('bone', ('Bone',), ('tbone',), (150, 150, 150)),
]


def load_ct(meta):
    g = meta['geometry']
    raw = np.frombuffer(gzip.open(os.path.join(meta['_dir'], 'volume.i16.gz')).read(), '<i2')
    d = g['dims']
    return raw.reshape(d[2], d[1], d[0]).transpose(2, 1, 0).astype(np.float32), g


def load_olsb(path):
    if not os.path.exists(path):
        out = subprocess.run(['node', os.path.join(HERE, 'olsb-labels.mjs'), REPO], check=True, capture_output=True).stdout
        open(path, 'wb').write(out)
    d = json.load(open(path))
    nx, ny, nz = d['dims']
    lab = np.frombuffer(base64.b64decode(d['lab_b64']), np.uint8).reshape(nz, ny, nx)
    return {'vox': d['vox'], 'o': np.array(d['o'], float), 'lab': lab, 'ids': d['ids']}


def grid_points(view, fixed_mm):
    ha, va, fa, hr, vr = VIEWS[view]
    h = np.arange(hr[0], hr[1] + (-PX if hr[1] < hr[0] else PX) / 2, -PX if hr[1] < hr[0] else PX)
    v = np.arange(vr[1], vr[0] - PX / 2, -PX)           # top row = upper value
    hh, vv = np.meshgrid(h, v)
    p = np.zeros(hh.shape + (3,))
    p[..., ha], p[..., va], p[..., fa] = hh, vv, fixed_mm
    return p, h, v


def boundary(mask, thick=2):
    return mask & ~ndi.binary_erosion(mask, iterations=thick, border_value=1)


def render(view, fixed_mm, ct, ctg, segs, segg, olsb, frame):
    r = np.array(frame['matrix'])[:3, :3]
    origin = np.array(frame['origin_ras'])
    p, h, v = grid_points(view, fixed_mm)
    shp = p.shape[:2]
    ras = origin + p.reshape(-1, 3) @ r                      # inverse of (ras - origin) @ r.T
    ci = F.ras_to_grid(ctg, ras)
    val = ndi.map_coordinates(ct, ci.T, order=1, mode='constant', cval=WINDOW[0]).reshape(shp)
    grey = np.clip((val - WINDOW[0]) / (WINDOW[1] - WINDOW[0]), 0, 1) * 255
    img = np.stack([grey] * 3, -1).astype(np.uint8)
    si = np.rint(F.ras_to_grid(segg, ras)).astype(np.int64)
    inb = ((si >= 0) & (si < np.array(segg['dims']))).all(1)
    oi = np.rint((p.reshape(-1, 3) - olsb['o']) / olsb['vox']).astype(np.int64)
    nz, ny, nx = olsb['lab'].shape
    oin = ((oi >= 0) & (oi < [nx, ny, nz]) ).all(1)
    olab = np.zeros(len(oi), np.uint8)
    olab[oin] = olsb['lab'][oi[oin, 2], oi[oin, 1], oi[oin, 0]]
    yy, xx = np.mgrid[0:shp[0], 0:shp[1]]
    dash = (((xx + yy) // 9) % 2 == 0)
    for key, zn, oids, col in STRUCT:
        m = np.zeros(len(si), bool)
        for n in zn:
            m |= inb & segs[n][tuple(np.where(inb[:, None], si, 0).T)]
        m = m.reshape(shp)
        if m.any():
            img[boundary(m, 1 if key == 'bone' else 2)] = col
        codes = [c for c, i in enumerate(olsb['ids']) if i in oids]
        om = np.isin(olab, codes).reshape(shp)
        if om.any():
            img[boundary(om, 1 if key == 'bone' else 2) & dash] = col
    # axes: faint dotted lines every 10 mm, a brighter cross at 0, tick numbers on the borders
    pil = Image.fromarray(img)
    d = ImageDraw.Draw(pil)
    for k, arr in ((0, h), (1, v)):
        lo, hi = sorted((arr[0], arr[-1]))
        for t in range(int(np.ceil(lo / 10)) * 10, int(hi // 10) * 10 + 1, 10):
            pos = int(np.argmin(np.abs(arr - t)))
            col = (255, 255, 0) if t == 0 else (90, 90, 90)
            if k == 0:
                for y in range(0, shp[0], 6 if t else 2):
                    d.point((pos, y), fill=col)
                d.text((pos + 3, 2), str(t), fill=(255, 255, 0))
            else:
                for x in range(0, shp[1], 6 if t else 2):
                    d.point((x, pos), fill=col)
                d.text((2, pos + 2), str(t), fill=(255, 255, 0))
    ha, va, fa, hr, vr = VIEWS[view]
    d.text((shp[1] - 150, shp[0] - 14), f'{AXN[fa]} = {fixed_mm:+.1f} mm', fill=(255, 255, 255))
    return pil


def b64(pil):
    b = io.BytesIO()
    pil.save(b, 'PNG', optimize=True)
    return base64.b64encode(b.getvalue()).decode()


def centroids(segs, segg):
    out = {}
    for n, m in segs.items():
        out[n] = F.mask_ras(segg, m).mean(0)
    out['cochlea'] = F.mask_ras(segg, segs['Scala Tympani'] | segs['Scala Vestibuli']).mean(0)
    return out


def bone_check(segs, segg, ct, ctg):
    rng = np.random.default_rng(0)
    nzb = np.nonzero(segs['Bone'])
    sel = rng.choice(len(nzb[0]), 100000, replace=False)
    bi = np.stack([a[sel] for a in nzb], 1)
    ci = np.stack([rng.integers(0, n, 100000) for n in segs['Bone'].shape], 1)
    ci = ci[~segs['Bone'][tuple(ci.T)]]
    res = {}
    for lab, idx in (('bone', bi), ('other', ci)):
        g = F.ras_to_grid(ctg, F.grid_to_ras(segg, idx))
        res[lab] = float(ndi.map_coordinates(ct, g.T, order=1, mode='nearest').mean())
    return res


def fit_frames(cent, ref, lm_med):
    """Frame A (OLSB model, as frame.json) and frame B (UW landmark medians): both rotation-only Kabsch, same footplate origin."""
    rows = [(n, g) for n, g in F.ROWS if g in ref]
    origin = np.array(frame_json['origin_ras'])
    out = {}
    for tag, refd in (('A', {g: np.array(ref[g], float) for _, g in rows}), ('B', lm_med)):
        use = [(n, g) for n, g in rows if g in refd]
        src = np.array([cent[n] for n, _ in use])
        tgt = np.array([refd[g] for _, g in use])
        r, rms, det = F._kabsch(src, tgt)
        out[tag] = {'use': use, 'r': r, 'rms': rms, 'det': det,
                    'sv': np.linalg.svd(src - src.mean(0), compute_uv=False),
                    'loo': dict(zip([g for _, g in use], F.loo_angles(src, tgt, r)))}
    # B without the carotid (its UW landmarks are the petrous apex segment, a different part of the vessel)
    use = [(n, g) for n, g in out['B']['use'] if g != 'ica']
    src = np.array([cent[n] for n, _ in use])
    tgt = np.array([lm_med[g] for _, g in use])
    r, rms, det = F._kabsch(src, tgt)
    out['B-ica'] = {'use': use, 'r': r, 'rms': rms, 'det': det,
                    'sv': np.linalg.svd(src - src.mean(0), compute_uv=False),
                    'loo': dict(zip([g for _, g in use], F.loo_angles(src, tgt, r)))}
    out['origin'] = origin
    return out


def esc(s):
    return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def v3(v):
    return '(' + ', '.join(f'{x:+.2f}' for x in v) + ')'


def main(argv=None):
    ap = argparse.ArgumentParser(description='Self-contained review page for an OpenEar specimen in OLSB frame.')
    ap.add_argument('name', help='specimen archive name, e.g. ZETA')
    a = ap.parse_args(argv)
    key = a.name.lower()
    d_nrrd = os.path.join(INC, 'openear', a.name)
    meta = json.load(open(os.path.join(INC, f'{key}-0.3', 'meta.json')))
    meta['_dir'] = os.path.join(INC, f'{key}-0.3')
    global frame_json
    frame_json = json.load(open(os.path.join(INC, f'{key}-frame', 'frame.json')))
    ref = json.load(open(os.path.join(INC, 'olsb-centroids.json')))
    olsb = load_olsb(os.path.join(INC, 'olsb-labels.json'))
    lm = json.load(open(F.LANDMARKS))['landmarks']
    lm_med = {g: np.median([x['point_mm'] for x in lm if x['g'] == g], axis=0) for g in {x['g'] for x in lm if x['g']}}
    ct, ctg = load_ct(meta)
    loaded = I.read_nrrd(os.path.join(d_nrrd, 'Segmentation.seg.nrrd'))
    segg = I.geometry(loaded[1])
    segs = I.read_segments(None, loaded)
    del loaded
    ctn, cth = I.read_nrrd(os.path.join(d_nrrd, 'CBCT_Unembedded.nrrd'))
    ctn_g = I.geometry(cth)
    bc = bone_check(segs, segg, ctn, ctn_g)
    del ctn
    cent = centroids(segs, segg)
    fits = fit_frames(cent, ref, lm_med)
    r_a, r_b = fits['A']['r'], fits['B']['r']
    ang_ab = F.rot_angle_deg(r_a, r_b)
    ang_ab2 = F.rot_angle_deg(r_a, fits['B-ica']['r'])
    origin = fits['origin']
    print(f'angle between frames A and B: {ang_ab:.2f} deg (B without ica: {ang_ab2:.2f})')

    # slice positions: origin; cochlea and facial nerve at the midpoint of the specimen's and OLSB's centroid
    def mid(gid, zname):
        t = (cent[zname] - origin) @ r_a.T
        return (t + np.array(ref[gid])) / 2
    pos = [('through the footplate origin', np.zeros(3)),
           ('through the cochlea (midpoint of specimen and model centroid)', mid('cochlea', 'cochlea')),
           ('through the facial nerve (midpoint of specimen and model centroid)', mid('fn', 'Facial Nerve'))]
    out = os.path.join(INC, f'review-{key}')
    os.makedirs(out, exist_ok=True)
    figs = []
    for title, p in pos:
        row = []
        for view in ('axial', 'coronal', 'sagittal'):
            fixed = p[VIEWS[view][2]]
            pil = render(view, float(fixed), ct, ctg, segs, segg, olsb, frame_json)
            pil.save(os.path.join(out, f'{view}-{len(figs)}.png'), optimize=True)
            row.append((view, float(fixed), b64(pil)))
            print('rendered', title, view, f'{fixed:+.2f}')
        figs.append((title, row))

    fj = frame_json
    css = ('body{font:14px/1.45 system-ui,sans-serif;max-width:1500px;margin:1rem auto;padding:0 1rem;color:#111;background:#fff}'
           'table{border-collapse:collapse;margin:.5rem 0}td,th{border:1px solid #bbb;padding:2px 8px;text-align:right}'
           'th{background:#eee}td:first-child,th:first-child{text-align:left}.bad{background:#fcc}.warn{background:#ffe9a8}'
           '.row{display:flex;gap:6px;flex-wrap:wrap}.row figure{margin:0;flex:1 1 30%}.row img{width:100%;height:auto;background:#000}'
           'figcaption{font-size:12px}code{background:#f2f2f2;padding:0 3px}.sw{display:inline-block;width:2.2em;height:.8em;margin:0 3px;vertical-align:middle}'
           'h2{margin-top:2rem;border-top:2px solid #333;padding-top:.5rem}.note{background:#f4f4f4;padding:.5rem .8rem}')
    h = [f'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
         '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'">',
         f'<title>OpenEar {esc(a.name)} in OLSB frame: review</title><style>{css}</style><body>',
         f'<h1>OpenEar {esc(a.name)} in OLSB&apos;s frame: placement review</h1>',
         f'<p class="note">{esc(ATTRIBUTION)}<br>Internal review of WP B4 (issue #301). Draft: the owner decides whether this placement is accepted. '
         'Nothing here is a clinical claim.</p>',
         '<h2>Frame and checks</h2><ul>',
         f'<li>Origin rule: {esc(fj["method"]["origin"])}.</li>',
         f'<li>Rotation rule: {esc(fj["method"]["rotation"])}.</li>',
         f'<li>Limits: {esc(fj["limits"])}.</li>',
         f'<li>Origin in the specimen&apos;s RAS mm: {v3(origin)}. Matrix (RAS mm to OLSB mm) 3x3 block:<br><code>'
         + '<br>'.join(' '.join(f'{x:+.4f}' for x in row) for row in r_a) + '</code></li>',
         f'<li>Handedness: det of the fitted rotation {np.linalg.det(r_a):+.6f}; unconstrained fit det {fj["det_unconstrained"]:+.6f} '
         f'(positive: no mirroring needed, a right ear); rms with reflection allowed {fj["rms_reflected_mm"]:.3f} mm, '
         f'rotation-only {fj["rms_fit_mm"]:.3f} mm (equal: the right-ear assumption holds).</li>',
         f'<li>CT under the segmentation, in this frame: mean scanner grey value of Bone voxels {bc["bone"]:.0f}, of non-Bone voxels {bc["other"]:.0f}.</li>',
         f'<li>Conditioning of fit A: singular values of the centred centroids {v3(fits["A"]["sv"])} mm; leave-one-out rotation angles (deg) '
         + ', '.join(f'{g} {x:.2f}' for g, x in fits['A']['loo'].items()) + f'; max {max(fits["A"]["loo"].values()):.2f}.</li>',
         f'<li>Bone bounding box in OLSB mm: {v3(fj["bone_bbox_mm"]["min"])} to {v3(fj["bone_bbox_mm"]["max"])}.</li></ul>',
         '<h2>CT slices in OLSB&apos;s frame</h2>',
         '<p>Bone window on scanner grey values (not HU). Radiological view for axial and coronal (x increases to the left, so a right ear&apos;s '
         'lateral side is on the left; anterior up in the axial; superior up in the coronal and sagittal; sagittal anterior to the right). Yellow '
         'ticks are mm in OLSB&apos;s frame. <strong>Solid</strong> outlines are the specimen&apos;s own segmentation; '
         '<strong>dashed</strong> outlines are OLSB&apos;s procedural model in the same plane.</p><p>',
         ''.join(f'<span class="sw" style="background:rgb{c}"></span>{k} ' for k, _, _, c in STRUCT) + '</p>']
    for title, row in figs:
        h.append(f'<h3>{esc(title)}</h3><div class="row">')
        for view, fixed, data in row:
            fa = VIEWS[view][2]
            h.append(f'<figure><img alt="{view} slice, {AXN[fa]} = {fixed:+.1f} mm" src="data:image/png;base64,{data}">'
                     f'<figcaption>{view}, {AXN[fa]} = {fixed:+.1f} mm</figcaption></figure>')
        h.append('</div>')

    def row_html(g, n):
        cA, cB = fits['A'], fits['B']
        t = (cent[n] - origin) @ r_a.T
        dA = np.linalg.norm(t - ref[g])
        cls = ' class="bad"' if dA > 3 else ''
        s = f'<tr><td>{g}</td><td>{v3(t)}</td><td>{v3(ref[g])}</td><td{cls}>{dA:.2f}</td>'
        return s, t

    h.append('<h2>Residuals: specimen centroid vs OLSB model centroid (frame A)</h2>'
             '<p>Millimetres in OLSB&apos;s frame. Every row also drove the rotation, so these understate disagreement. Red: more than 3 mm.</p>'
             '<table><tr><th>structure</th><th>specimen centroid</th><th>OLSB model centroid</th><th>distance</th></tr>')
    names = dict((g, n) for n, g in F.ROWS)
    big = []
    for g in [x['id'] for x in fj['residuals']]:
        s, _ = row_html(g, names[g])
        h.append(s + '</tr>')
        if np.linalg.norm((cent[names[g]] - origin) @ r_a.T - ref[g]) > 3:
            big.append(g)
    h.append('</table>')
    dists = [np.linalg.norm((cent[names[g]] - origin) @ r_a.T - ref[g]) for g in names if g in ref]
    h.append(f'<p>Summary: mean {np.mean(dists):.2f} mm, max {max(dists):.2f} mm, rms {np.sqrt(np.mean(np.square(dists))):.2f} mm; '
             f'structures over 3 mm: {len(big)} ({", ".join(big)}).</p>')

    # (c) independent fit
    h.append('<h2>Independent second fit: UW real-CT landmarks instead of the procedural model</h2>'
             '<p>Frame A fits the rotation to OLSB&apos;s procedural model, which is the very thing it is then compared with. Frame B removes that '
             'circularity: the same Kabsch rotation (no scale, same footplate origin) fitted to the median of the UW atlas tips of each shared glossary id '
             '(<code>tbone/geometry/landmarks.json</code>, a real CT of another specimen). A UW tip marks a place on a structure, not its centroid '
             '(tips of one structure scatter by 1.5 to 2.5 mm), and for <code>ica</code> the UW tips are the petrous segment only, so B is noisier; '
             'B&minus;ica leaves the carotid out.</p>')
    ids_b = [g for _, g in fits['B']['use']]
    h.append(f'<p>Landmark ids shared with the specimen&apos;s segments: {", ".join(ids_b)}. Rotation angle between frame A and frame B: '
             f'<strong>{ang_ab:.2f} deg</strong> (A vs B&minus;ica: {ang_ab2:.2f} deg). Fit B: rms {fits["B"]["rms"]:.2f} mm, '
             f'singular values {v3(fits["B"]["sv"])}, det {fits["B"]["det"]:+.4f}, leave-one-out max '
             f'{max(fits["B"]["loo"].values()):.2f} deg ({", ".join(f"{g} {x:.1f}" for g, x in fits["B"]["loo"].items())}). '
             f'Fit B&minus;ica: rms {fits["B-ica"]["rms"]:.2f} mm, leave-one-out max {max(fits["B-ica"]["loo"].values()):.2f} deg.</p>')
    h.append('<table><tr><th rowspan="2">structure</th><th colspan="2">frame A (model fit): distance to</th><th colspan="2">frame B (UW landmarks fit): distance to</th></tr>'
             '<tr><th>OLSB model</th><th>UW landmark median</th><th>OLSB model</th><th>UW landmark median</th></tr>')
    for n, g in F.ROWS:
        if g not in ref:
            continue
        cells = []
        for tag in ('A', 'B'):
            rr = fits[tag]['r']
            t = (cent[n] - origin) @ rr.T
            cells.append(f'{np.linalg.norm(t - ref[g]):.2f}')
            cells.append(f'{np.linalg.norm(t - lm_med[g]):.2f}' if g in lm_med else 'n/a')
        h.append(f'<tr><td>{g}</td>' + ''.join(f'<td>{c}</td>' for c in cells) + '</tr>')
    h.append('</table>')
    sA = [np.linalg.norm((cent[n] - origin) @ r_a.T - lm_med[g]) for n, g in F.ROWS if g in lm_med and g in ref]
    sB = [np.linalg.norm((cent[n] - origin) @ r_b.T - lm_med[g]) for n, g in F.ROWS if g in lm_med and g in ref]
    h.append(f'<p>Distances to the UW landmark medians, over the {len(sA)} shared ids: frame A mean {np.mean(sA):.2f} mm (max {max(sA):.2f}); '
             f'frame B mean {np.mean(sB):.2f} mm (max {max(sB):.2f}). The origin is the specimen&apos;s footplate in both, '
             'and the UW origin is the median oval-window tip (spread about 1.5 mm).</p>')
    h.append(f'<h2>Attribution</h2><p>{esc(ATTRIBUTION)}</p></body></html>')
    open(os.path.join(out, 'index.html'), 'w').write('\n'.join(h))
    print('wrote', os.path.join(out, 'index.html'), os.path.getsize(os.path.join(out, 'index.html')), 'bytes')
    print('over 3 mm:', big)
    return 0


if __name__ == '__main__':
    sys.exit(main())
