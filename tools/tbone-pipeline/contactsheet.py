"""Review sheets: sweeps and landmarks drawn over the UW slices, in all four planes (not committed).

    .venv/bin/python -I tools/tbone-pipeline/contactsheet.py OUTDIR [--only fn,iac,...]

Per plane, the slices that most sweep points fall on (within half a slice step) are cropped to the temporal
bone and enlarged; sweep points are drawn in a colour per structure, shape by status (filled = detected, ring =
labelled, small cross = inferred); UW's own landmark tips on that slice are drawn as white plus signs with their
canonical name. A mismatch between a sweep and the anatomy shows here first. Also one sheet per facial-nerve
segment and one per other structure family (zoomed on the sweep). Images are written under OUTDIR only.
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402
import geom as G  # noqa: E402

COL = {'facial-nerve': (255, 70, 70), 'iac': (255, 200, 0), 'petrous-ica': (255, 120, 255), 'jugular-bulb': (80, 120, 255),
       'sigmoid-sinus': (60, 200, 255), 'cochlear-aqueduct': (0, 255, 160), 'vestibular-aqueduct': (120, 255, 0),
       'eac': (255, 160, 60), 'eustachian-tube': (200, 120, 60), 'lscc': (0, 255, 255), 'pscc': (0, 200, 255),
       'sscc': (100, 255, 255), 'basal-turn': (255, 255, 120), 'gspn': (255, 150, 150)}


def load_sweeps():
    return json.load(open(os.path.join(C.OUT, 'geometry', 'sweeps.json')))


def all_points(sw):
    for sid, s in sw['sweeps'].items():
        fam = s.get('family', sid)
        for seg in s['segments']:
            for p, st in zip(seg['pts'], seg['status']):
                yield sid, fam, seg['name'], np.array(p), st


def draw_pt(dr, x, y, col, st, r=3):
    if st == 'detected':
        dr.ellipse([x - r, y - r, x + r, y + r], fill=col)
    elif st == 'labelled':
        dr.ellipse([x - r - 1, y - r - 1, x + r + 1, y + r + 1], outline=col, width=2)
    else:
        dr.line([x - r, y - r, x + r, y + r], fill=col, width=1); dr.line([x - r, y + r, x + r, y - r], fill=col, width=1)


def sheet(plane, sw, lm, fr, outdir, only=None, crop=None, nsl=8, zoom=2, tag=''):
    params = None if plane == 'axial' else G.reg_params(plane)
    dzpx = fr['dz_px']
    pts = [(sid, fam, seg, p, st) for sid, fam, seg, p, st in all_points(sw) if (only is None or fam in only or sid in only)]
    if not pts:
        return None
    PX = np.array([G.mm_to_px(*p, fr) for _, _, _, p, _ in pts])  # axial (x, y, n)
    if plane == 'axial':
        UVK = PX
    else:
        O, e1, e2, w, dzp = G.REG.frame('x', params, G.EYE)
        M = np.stack([e1, e2, w], 1)
        P3 = np.stack([PX[:, 0], PX[:, 1], PX[:, 2] * dzp], 1)
        UVK = np.linalg.solve(M, (P3 - O).T).T
    nK = C.load(plane).shape[0]
    kk = np.round(UVK[:, 2]).astype(int)
    near = np.abs(UVK[:, 2] - kk) <= 0.6
    cnt = np.bincount(kk[near & (kk >= 0) & (kk < nK)], minlength=nK)
    ks = sorted(np.argsort(-cnt)[:nsl])
    ks = [k for k in ks if cnt[k] > 0]
    if not ks:
        return None
    sel = UVK[near]
    if crop is None:
        u0, v0 = sel[:, 0].min() - 60, sel[:, 1].min() - 60
        u1, v1 = sel[:, 0].max() + 60, sel[:, 1].max() + 60
        crop = [int(max(0, u0)), int(max(0, v0)), int(min(512, u1)), int(min(512, v1))]
    cw, ch = crop[2] - crop[0], crop[3] - crop[1]
    cols = 4
    rows = (len(ks) + cols - 1) // cols
    sheet_im = Image.new('RGB', (cols * cw * zoom, rows * ch * zoom), (20, 20, 20))
    for i, k in enumerate(ks):
        im = Image.open(os.path.join(C.RAW, plane, f'img{k + 1:02d}.jpg')).convert('RGB').crop(crop).resize((cw * zoom, ch * zoom), Image.LANCZOS)
        dr = ImageDraw.Draw(im)
        for j, ((sid, fam, seg, p, st), uvk) in enumerate(zip(pts, UVK)):
            if abs(uvk[2] - k) <= 0.6:
                draw_pt(dr, (uvk[0] - crop[0]) * zoom, (uvk[1] - crop[1]) * zoom, COL.get(fam, (255, 255, 255)), st)
        for r in lm['landmarks']:
            if r['plane'] == plane and r['slices'][0] - 1 <= k <= r['slices'][1] - 1:
                x, y = (r['tip_px'][0] - crop[0]) * zoom, (r['tip_px'][1] - crop[1]) * zoom
                dr.line([x - 4, y, x + 4, y], fill=(255, 255, 255)); dr.line([x, y - 4, x, y + 4], fill=(255, 255, 255))
                dr.text((x + 5, y - 4), (r['name'] or '?')[:14], fill=(230, 230, 230))
        dr.text((4, 4), f'{plane} {k + 1}', fill=(255, 255, 0))
        sheet_im.paste(im, ((i % cols) * cw * zoom, (i // cols) * ch * zoom))
    os.makedirs(outdir, exist_ok=True)
    path = os.path.join(outdir, f'sheet_{tag or "all"}_{plane}.png')
    sheet_im.save(path)
    return path


def main():
    outdir = sys.argv[1]
    only = None
    if '--only' in sys.argv:
        only = set(sys.argv[sys.argv.index('--only') + 1].split(','))
    sw = load_sweeps()
    lm = json.load(open(os.path.join(C.OUT, 'geometry', 'landmarks.json')))
    fr = G.frame()
    for plane in C.PLANES:
        print(sheet(plane, sw, lm, fr, outdir, only, tag=(sys.argv[sys.argv.index('--tag') + 1] if '--tag' in sys.argv else ('_'.join(sorted(only)) if only else 'all'))))


if __name__ == '__main__':
    main()
