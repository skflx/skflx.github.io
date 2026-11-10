"""The ear-anatomy guide's ten UW CT slices and their hotspot regions, generated.

  python -I tools/tbone-pipeline/slices.py            # write crops, rewrite the regions in imaging.js
  python -I tools/tbone-pipeline/slices.py --check    # write nothing; fail if anything on disk would change

Inputs: the raw UW slices in incoming/ and tbone/geometry/landmarks.json (UW's own label tips, see
landmarks.py). Outputs: images/oksat/ear-anatomy/ct/<ax|co>-<n>.jpg, and the `regions` of each matching frame in
js/oksat/guides/ear-anatomy/imaging.js. Nothing else in that file is touched.

Crops. Each plane has one fixed crop box (CROP, in raw 512 x 512 pixels: x0, y0, w, h), recorded here. The
crop is the raw unlabelled slice, grayscale, saved with fixed encoder settings and no metadata, so a rerun is
byte-identical for one Pillow/libjpeg build.

Regions. For a slice, every landmark of that plane whose slice run contains the slice, whose `g` is a glossary id
(js/olsb/glossary.js) and whose tip lies inside the crop becomes one region: a regular octagon of radius
REGION_RADIUS_MM centred on the tip (mm converted to pixels by the pipeline's scale, landmarks.json `scale`),
in percent of the crop. It is a POINTER region, not a segmentation: the tip marks a place on a structure, not
its outline, and tips of one structure scatter by 1.5-2.5 mm between planes (tbone/README.md). Nothing is
nudged, merged or hand-placed; a structure with no tip (or no glossary id) on a slice has no region. Regions
agree with UW's labels by construction: that is provenance, not validation. Draft until the owner vets them.
"""
import io, json, math, os, re, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from common import RAW, REPO, OUT  # noqa: E402

REGION_RADIUS_MM = 1.0          # octagon circumradius; the one region-size constant
JPEG_QUALITY = 85               # fixed encoder settings
CROP = {'axial': (70, 60, 360, 400), 'coronal': (20, 120, 380, 316)}   # x0, y0, w, h in raw pixels
SLICES = [('axial', 'ax', n) for n in (18, 30, 41, 47, 56)] + [('coronal', 'co', n) for n in (21, 18, 17, 15, 10)]
CT_DIR = os.path.join(REPO, 'images', 'oksat', 'ear-anatomy', 'ct')
GUIDE = os.path.join(REPO, 'js', 'oksat', 'guides', 'ear-anatomy', 'imaging.js')
GLOSSARY = os.path.join(REPO, 'js', 'olsb', 'glossary.js')


def glossary_ids():
    return set(re.findall(r'^\s+"([\w-]+)":\s*\{', open(GLOSSARY).read(), re.M))


def crop_bytes(plane, n):
    x0, y0, w, h = CROP[plane]
    im = Image.open(os.path.join(RAW, plane, f'img{n:02d}.jpg')).convert('L').crop((x0, y0, x0 + w, y0 + h))
    buf = io.BytesIO()
    im.save(buf, 'JPEG', quality=JPEG_QUALITY, optimize=True, progressive=False)
    return buf.getvalue()


def regions(lm, gl, plane, n):
    """-> (kept [(g, name, tip_px, poly)], dropped [(name, reason)]) for one slice."""
    x0, y0, w, h = CROP[plane]
    r = REGION_RADIUS_MM / lm['scale']['s_mm_per_px']
    kept, dropped = [], []
    for l in lm['landmarks']:
        if l['plane'] != plane or not (l['slices'][0] <= n <= l['slices'][1]):
            continue
        if not l['g']:
            dropped.append((l['name'], 'no glossary id'))
            continue
        if l['g'] not in gl:
            dropped.append((l['name'], f"g {l['g']} not in glossary"))
            continue
        tx, ty = l['tip_px'][0] - x0, l['tip_px'][1] - y0
        if not (0 <= tx < w and 0 <= ty < h):
            dropped.append((l['name'], 'tip outside crop'))
            continue
        poly = []
        for k in range(8):
            a = math.pi / 8 + k * math.pi / 4
            poly += [round(100 * (tx + r * math.cos(a)) / w, 1), round(100 * (ty + r * math.sin(a)) / h, 1)]
        kept.append((l['g'], l['name'], l['tip_px'], poly))
    kept.sort(key=lambda t: (t[3][1], t[3][0], t[0]))   # stable order: top to bottom, then left
    return kept, dropped


def fmt(kept):
    out = ['regions: [']
    for g, _, _, poly in kept:
        out += ['    {', f"        g: '{g}',", '        poly: [' + ', '.join(repr(v) for v in poly) + '],', '    },']
    out.append('],')
    return out


def rewrite(js, name, kept):
    """Replace the `regions: [...]` that follows `ct/<name>.jpg` in the guide source."""
    i = js.index(f"ct/{name}.jpg'")
    a = js.index('regions: [', i)
    depth, j = 0, a + len('regions: ')
    while True:
        depth += {'[': 1, ']': -1}.get(js[j], 0)
        j += 1
        if depth == 0:
            break
    if js[j] == ',':
        j += 1
    ls = js.rfind('\n', 0, a) + 1
    ind = js[ls:a]
    text = ('\n' + ind).join(fmt(kept))
    return js[:a] + text + js[j:]


def main():
    check = '--check' in sys.argv
    lm = json.load(open(os.path.join(OUT, 'geometry', 'landmarks.json')))
    gl = glossary_ids()
    js = open(GUIDE).read()
    bad = False
    for plane, ab, n in SLICES:
        name = f'{ab}-{n}'
        data = crop_bytes(plane, n)
        path = os.path.join(CT_DIR, name + '.jpg')
        same = os.path.exists(path) and open(path, 'rb').read() == data
        kept, dropped = regions(lm, gl, plane, n)
        print(f'{name}: {len(kept)} regions, {len(dropped)} dropped, crop {"unchanged" if same else "NEW"}')
        for g, nm, tip, _ in kept:
            print(f'    {g:14s} {nm:26s} tip {tip}')
        if len(kept) < 3:
            print(f'    WARNING: {name} has {len(kept)} regions; a find-mode hotspot needs 3 (check-data)')
        for nm, why in dropped:
            print(f'    dropped {nm}: {why}')
        js = rewrite(js, name, kept)
        if not same:
            bad = True
            if not check:
                os.makedirs(CT_DIR, exist_ok=True)
                open(path, 'wb').write(data)
    if js != open(GUIDE).read():
        bad = True
        if not check:
            open(GUIDE, 'w').write(js)
    if check and bad:
        print('STALE: rerun slices.py without --check')
        sys.exit(1)


if __name__ == '__main__':
    main()
