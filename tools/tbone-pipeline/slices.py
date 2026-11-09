"""Ear-guide CT crops and hotspot regions, generated from the UW pipeline's own tips (WP E4, #251).

    .venv/bin/python -I tools/tbone-pipeline/slices.py           # writes the ten crops, prints the regions
    .venv/bin/python -I tools/tbone-pipeline/slices.py --apply   # also rewrites the hotspot polys in js/oksat/guides/ear-anatomy/imaging.js

Inputs: incoming/uw-temporalbone/<plane>/imgNN.jpg (the unlabelled UW slices, fetch.py; never committed)
and tbone/geometry/landmarks.json (tips, written by landmarks.py). Needs Pillow and numpy, as in
tools/ssb-pipeline/requirements.txt.

Crops. Each committed crop is the unlabelled slice of the same plane and number, cut at BOX and encoded with
Pillow at JPEG_QUALITY, optimize=True. How these were found: an FFT cross-correlation of each committed crop
against its raw slice gave the same box for all ten (the best offset's MSE is 1.0-2.1, the next-best offset
MSE is above 18, so the box is exact and unscaled). The quantisation table matches libjpeg quality 82
(scale 36); optimize=True reproduces the committed bytes, progressive or default Huffman do not.

Regions. A tip is a pixel (tip_px) in its plane's raw frame, valid on every slice of its run
(`slices` = [first, last]). A tip with g null (no glossary id) is not drawn. For each (slice, g), the
region is the convex hull of a disc of RADIUS_PX around each of its tips, clamped to the crop. RADIUS_PX
is about 2 mm at 0.1758 mm per pixel (tbone/README.md: tips scatter 1.5-2.5 mm). The shape is a
convention, not structure outline: regions stay draft until the owner vets them.
"""
import json
import math
import os
import re
import sys
import hashlib
import io

from PIL import Image

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
RAW = os.path.join(REPO, 'tools', 'tbone-pipeline', 'incoming', 'uw-temporalbone')
OUT = os.path.join(REPO, 'images', 'oksat', 'ear-anatomy', 'ct')
LANDMARKS = os.path.join(REPO, 'tbone', 'geometry', 'landmarks.json')
GLOSSARY = os.path.join(REPO, 'js', 'olsb', 'glossary.js')
GUIDE = os.path.join(REPO, 'js', 'oksat', 'guides', 'ear-anatomy', 'imaging.js')

# (left, upper, right, lower) in raw pixels; see the docstring for how these were found.
BOX = {'axial': (70, 60, 430, 460), 'coronal': (20, 120, 400, 436)}
JPEG_QUALITY = 82
RADIUS_PX = 11

CROPS = [('ax-18', 'axial', 18), ('ax-30', 'axial', 30), ('ax-41', 'axial', 41),
         ('ax-47', 'axial', 47), ('ax-56', 'axial', 56),
         ('co-10', 'coronal', 10), ('co-15', 'coronal', 15), ('co-17', 'coronal', 17),
         ('co-18', 'coronal', 18), ('co-21', 'coronal', 21)]


def glossary_ids():
    src = open(GLOSSARY, encoding='utf-8').read()
    return set(re.findall(r'^\s{8}"([a-z0-9-]+)":\s*\{', src, re.M))


def encode_crop(plane, n):
    path = os.path.join(RAW, plane, 'img%02d.jpg' % n)
    if not os.path.exists(path):
        raise SystemExit('missing raw slice: %s (run fetch.py)' % path)
    img = Image.open(path).convert('L').crop(BOX[plane])
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=JPEG_QUALITY, optimize=True)
    return buf.getvalue(), img.size


def hull(points):
    pts = sorted(set(points))
    if len(pts) <= 2:
        return pts

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower, upper = [], []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]


def regions_for(plane, n, size, tips, known):
    """{g: (poly in crop px, [tip ids])} for one crop."""
    W, H = size
    by_g = {}
    skipped = []
    for t in tips:
        if t['plane'] != plane or not (t['slices'][0] <= n <= t['slices'][1]):
            continue
        if t['g'] is None or t['g'] not in known:
            skipped.append(t['id'])
            continue
        left, upper = BOX[plane][0], BOX[plane][1]
        x, y = t['tip_px'][0] - left, t['tip_px'][1] - upper
        if not (0 <= x < W and 0 <= y < H):
            skipped.append(t['id'] + ' (outside crop)')
            continue
        by_g.setdefault(t['g'], []).append((t['id'], x, y))
    out = {}
    for g in sorted(by_g):
        pts = []
        for _, x, y in by_g[g]:
            for k in range(8):
                a = k * math.pi / 4
                px = min(max(x + RADIUS_PX * math.cos(a), 0), W)
                py = min(max(y + RADIUS_PX * math.sin(a), 0), H)
                pts.append((round(px, 2), round(py, 2)))
        out[g] = (hull(pts), [i for i, _, _ in by_g[g]])
    return out, skipped


def poly_percent(poly, size):
    W, H = size
    flat = []
    for x, y in poly:
        flat += [round(x / W * 100, 1), round(y / H * 100, 1)]
    return flat


def apply_guide(name, percent):
    """Rewrite the poly of each frame region whose g has tips on this slice; other regions stay."""
    text = open(GUIDE, encoding='utf-8').read()
    head = "src: 'images/oksat/ear-anatomy/ct/%s.jpg'" % name
    start = text.index(head)
    ends = [i for i in (text.find("src: '", start + 1), text.find("t: '", start + 1)) if i != -1]
    end = min(ends) if ends else len(text)
    seg = text[start:end]
    done = []

    def sub(m):
        g = m.group(2)
        if g not in percent:
            return m.group(0)
        done.append(g)
        body = ', '.join('%g' % v for v in percent[g])
        return "%s%s%s" % (m.group(1), body, m.group(4))

    seg2 = re.sub(r"(g: '([^']+)',\s*poly: \[)([^\]]*)(\])", sub, seg)
    open(GUIDE, 'w', encoding='utf-8').write(text[:start] + seg2 + text[end:])
    return done


def main(argv):
    apply = '--apply' in argv
    with open(LANDMARKS, encoding='utf-8') as fh:
        tips = json.load(fh)['landmarks']
    known = glossary_ids()
    os.makedirs(OUT, exist_ok=True)
    for name, plane, n in CROPS:
        data, size = encode_crop(plane, n)
        with open(os.path.join(OUT, name + '.jpg'), 'wb') as fh:
            fh.write(data)
        print('%s  sha256 %s  %d bytes  box %s  size %dx%d' % (
            name, hashlib.sha256(data).hexdigest()[:16], len(data), BOX[plane], size[0], size[1]))
        regions, skipped = regions_for(plane, n, size, tips, known)
        for g, (poly, ids) in regions.items():
            pct = poly_percent(poly, size)
            xs = [p[0] for p in poly]
            ys = [p[1] for p in poly]
            print('  %-14s tips=%d  bbox_px x %.0f-%.0f y %.0f-%.0f  poly%%=%s' % (
                g, len(ids), min(xs), max(xs), min(ys), max(ys), pct))
        for s in skipped:
            print('  skipped (no glossary id or outside crop): %s' % s)
        if apply:
            done = apply_guide(name, {g: poly_percent(p, size) for g, (p, _) in regions.items()})
            print('  guide: rewrote %d region poly(s): %s' % (len(done), ', '.join(done)))


if __name__ == '__main__':
    main(sys.argv[1:])
