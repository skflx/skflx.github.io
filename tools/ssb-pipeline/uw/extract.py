"""Per labeled atlas slice: isolate the Photoshop annotations (pure-white text +
arrows) by threshold, OCR the text locally, find each arrow's tip and tail,
and attach arrows to the text box their tail starts from.

Output: ssb/reference/uw-sinusanatomy2/slices.json = {plane: [{n, scout_rect, fov_center, labels: [
  {text, conf, box:[x0,y0,x1,y1], tips:[[x,y],...], arrowless:bool}]}]}"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.measure import label as cc_label, regionprops
from skimage.morphology import skeletonize
from rapidocr_onnxruntime import RapidOCR

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, '..', 'incoming', 'uw-sinusanatomy2')  # from fetch.py; gitignored
OUT = os.path.join(HERE, '..', '..', '..', 'ssb', 'reference', 'uw-sinusanatomy2', 'slices.json')
ocr = RapidOCR()

def gray(path):
    return np.asarray(Image.open(path).convert('L'), dtype=np.int16)

def annotation_mask(lab, unlab):
    bright_ct = ndi.binary_dilation(unlab >= 228, iterations=3)
    return (lab >= 235) & ~bright_ct

def fov_center(unlab):
    body = unlab > 12
    ys, xs = np.nonzero(body)
    return [float(xs.mean()), float(ys.mean())] if len(xs) else None

def endpoints(skel):
    k = np.ones((3, 3), int); k[1, 1] = 0
    nb = ndi.convolve(skel.astype(int), k, mode='constant')
    ys, xs = np.nonzero(skel & (nb == 1))
    return list(zip(xs.tolist(), ys.tolist()))

def ocr_boxes(mask, lab):
    # keep the real anti-aliased glyph pixels around the annotations; black elsewhere
    keep = ndi.binary_dilation(mask, iterations=2)
    g = np.where(keep, lab, 0).astype(np.uint8)
    g = np.asarray(Image.fromarray(g).resize((g.shape[1] * 2, g.shape[0] * 2), Image.LANCZOS))
    img = np.pad(np.stack([g] * 3, axis=-1), ((20, 20), (20, 20), (0, 0)))
    res, _ = ocr(img)
    out = []
    for quad, text, conf in res or []:
        q = (np.array(quad) - 20) / 2
        x0, y0 = q.min(0); x1, y1 = q.max(0)
        out.append({'text': text.strip(), 'conf': round(float(conf), 3), 'box': [int(x0), int(y0), int(x1), int(y1)]})
    return out

def box_dist(b, p):
    x0, y0, x1, y1 = b; x, y = p
    dx = max(x0 - x, 0, x - x1); dy = max(y0 - y, 0, y - y1)
    return (dx * dx + dy * dy) ** 0.5

def analyse(lab_path, unlab_path):
    lab, unlab = gray(lab_path), gray(unlab_path)
    mask = annotation_mask(lab, unlab)
    texts = ocr_boxes(mask, lab)
    # remove text pixels (slightly grown boxes) to leave arrows
    arrows_mask = mask.copy()
    for t in texts:
        x0, y0, x1, y1 = t['box']
        arrows_mask[max(0, y0 - 2):y1 + 3, max(0, x0 - 2):x1 + 3] = False
    for t in texts:
        t['tips'] = []
    comps = cc_label(arrows_mask, connectivity=2)
    for r in regionprops(comps):
        if r.area < 25:
            continue
        minr, minc, maxr, maxc = r.bbox
        if max(maxr - minr, maxc - minc) < 12:
            continue  # speck, not an arrow
        sub = comps[minr:maxr, minc:maxc] == r.label
        ends = [(x + minc, y + minr) for x, y in endpoints(skeletonize(sub))]
        if len(ends) < 2:
            continue
        # the two most distant endpoints are the shaft's ends
        best = max(((a, b) for i, a in enumerate(ends) for b in ends[i + 1:]),
                   key=lambda ab: (ab[0][0] - ab[1][0]) ** 2 + (ab[0][1] - ab[1][1]) ** 2)
        def mass(p, rad=6):
            x, y = p
            return int(arrows_mask[max(0, y - rad):y + rad + 1, max(0, x - rad):x + rad + 1].sum())
        a, b = best
        if not texts:
            continue
        # an arrow starts at its own label: the end nearest a text box is the tail;
        # arrowhead mass only breaks near-ties (crossing arrows fooled mass alone)
        da = min(box_dist(t['box'], a) for t in texts)
        db = min(box_dist(t['box'], b) for t in texts)
        if abs(da - db) > 6:
            tail, tip = (a, b) if da < db else (b, a)
        else:
            tip, tail = (a, b) if mass(a) >= mass(b) else (b, a)
        owner = min(texts, key=lambda t: box_dist(t['box'], tail))
        if box_dist(owner['box'], tail) <= 40:
            owner['tips'].append([int(tip[0]), int(tip[1])])
    for t in texts:
        t['arrowless'] = not t['tips']
    return texts, fov_center(unlab)

def main(planes):
    manifest = json.load(open(os.path.join(RAW, 'manifest.json')))
    out_path = OUT
    out = json.load(open(out_path)) if os.path.exists(out_path) else {}
    for plane in planes:
        rows = []
        for s in manifest['atlas'][plane]['slices']:
            texts, fov = analyse(os.path.join(RAW, s['lab']), os.path.join(RAW, s['img']))
            rows.append({'n': s['n'], 'scout_rect': s['scout_rect'], 'fov_center': fov, 'labels': texts})
        out[plane] = rows
        n_lab = sum(len(r['labels']) for r in rows)
        n_arrowless = sum(t['arrowless'] for r in rows for t in r['labels'])
        print(plane, len(rows), 'slices', n_lab, 'labels', n_arrowless, 'arrowless')
        json.dump(out, open(out_path, 'w'), indent=1)

if __name__ == '__main__':
    main(sys.argv[1:] or ['axial', 'coronal', 'sagittal'])
