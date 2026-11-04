"""Per labeled temporal-bone slice: annotation mask, OCR, arrow tips (WP T1).

    .venv/bin/python -I tools/tbone-pipeline/extract.py [plane ...]

What is reused from SSB (tools/ssb-pipeline/uw/extract.py, loaded unchanged): the annotation mask (pure
white text and arrows, minus bright CT bone), the grey loader and the RapidOCR instance.
What is new, because the temporal-bone slices need it:
  * text boxes: the SSB pass OCRs only a dilated mask and misses labels whose glyphs touch an arrow
    ('facial recess', 'basal turn cochlea'); here the whole slice is thresholded at 200 (bone brighter
    than that removed with the unlabelled twin) and OCRed at 2x, then every box is re-read at 3x from the
    raw labelled slice (clean text), and two-line / wide-gap labels are merged.
  * arrow tips by arrowhead (tips.py), not by shaft ends; an arrowhead no box claims is followed back
    along its shaft to the label it starts from and that label is OCRed there (orphan recovery).

Output (derived numbers + text, no pixels): tools/tbone-pipeline/work/slices-<plane>.json
  [{n, scout_rect, labels: [{text, ocr0, conf, box, tips, recovered, merged, arrowless}], orphans}]}
Acceptance (WP T1): counts per plane printed; every labelled slice has >= 1 label.
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402
import tips as TP  # noqa: E402

EX = C.ssb('extract')
RAW = C.RAW


def ocr_page(lab, un):
    """OCR of the whole labelled slice: white text only (CT bone > 215 in the twin removed)."""
    txt = (lab >= 200) & ~ndi.binary_dilation(un >= 215, iterations=1)
    g = np.where(txt, np.clip((lab.astype(float) - 200) * 255 / 55, 0, 255), 0).astype(np.uint8)
    g = np.asarray(Image.fromarray(g).resize((g.shape[1] * 2, g.shape[0] * 2), Image.BICUBIC))
    img = np.pad(np.stack([g] * 3, axis=-1), ((20, 20), (20, 20), (0, 0)))
    res, _ = EX.ocr(img)
    out = []
    for quad, text, conf in res or []:
        q = (np.array(quad) - 20) / 2
        x0, y0 = q.min(0); x1, y1 = q.max(0)
        out.append({'text': text.strip(), 'conf': round(float(conf), 3), 'box': [int(x0), int(y0), int(x1), int(y1)]})
    return out


def reocr(lab, box, scale=3):
    """Re-read one text box from the raw labelled slice: stretch the white text, upscale 3x, OCR again
    (much cleaner than the 2x page pass: 'sirus tymsari' -> 'sinus tympani')."""
    x0, y0, x1, y1 = box
    x0 = max(0, x0 - 6); y0 = max(0, y0 - 4); x1 = min(lab.shape[1], x1 + 6); y1 = min(lab.shape[0], y1 + 4)
    c = np.clip((lab[y0:y1, x0:x1].astype(float) - 120) * 255 / 135, 0, 255).astype(np.uint8)
    im = Image.fromarray(c).resize(((x1 - x0) * scale, (y1 - y0) * scale), Image.BICUBIC)
    a = np.pad(np.stack([np.asarray(im)] * 3, -1), ((20, 20), (20, 20), (0, 0)))
    r, _ = EX.ocr(a)
    return ' '.join(t for _, t, _ in (r or []))


def trace_back(A3, tip, d, maxlen=420):
    """Follow a shaft from the arrowhead back along -d while the mask stays on (gaps <= 3 px)."""
    last, gap = None, 0
    for s in range(4, maxlen):
        q = tip - d * s
        xi, yi = int(round(q[0])), int(round(q[1]))
        if not (0 <= yi < A3.shape[0] and 0 <= xi < A3.shape[1]):
            break
        if A3[yi, xi]:
            last, gap = q, 0
        else:
            gap += 1
            if gap > 3:
                break
    return last


def merge_lines(labels):
    """A two-line label ('incus long' / 'process') is two OCR boxes with one arrow, and so is a label
    split at a wide gap ('facial' / 'recess'). A box without a tip that sits directly under/over (or
    beside, on the same line of) the nearest box with tips joins it."""
    tipped = [t for t in labels if t['tips']]
    rest = []
    for t in labels:
        if t['tips']:
            continue
        x0, y0, x1, y1 = t['box']
        best = None
        for h in tipped:
            hx0, hy0, hx1, hy1 = h['box']
            xov = min(x1, hx1) - max(x0, hx0)
            yov = min(y1, hy1) - max(y0, hy0)
            vgap = max(y0 - hy1, hy0 - y1)
            hgap = max(x0 - hx1, hx0 - x1)
            if xov > 0.3 * min(x1 - x0, hx1 - hx0) and vgap < 8:
                d, side = vgap, 'v'
            elif yov > 0.5 * min(y1 - y0, hy1 - hy0) and hgap < 14:
                d, side = hgap, 'h'
            else:
                continue
            if best is None or d < best[1]:
                best = (h, d, side)
        if not best:
            rest.append(t)
            continue
        h, _, side = best
        before = (x0 < h['box'][0]) if side == 'h' else (y0 < h['box'][1])
        h['text'] = (t['text'] + ' ' + h['text']) if before else (h['text'] + ' ' + t['text'])
        h['box'] = [min(h['box'][0], x0), min(h['box'][1], y0), max(h['box'][2], x1), max(h['box'][3], y1)]
        h['merged'] = True
    return tipped + rest


def shaft_from_label(A3, box, min_run=20):
    """Fallback for a label whose arrowhead was not isolated (heads merged with a neighbour): the longest
    straight mask run leaving the label's grown box, its far end taken as the tip."""
    x0, y0, x1, y1 = box
    starts = [(x0 - 4, (y0 + y1) / 2), (x1 + 4, (y0 + y1) / 2), ((x0 + x1) / 2, y0 - 4), ((x0 + x1) / 2, y1 + 4),
              (x0 - 4, y0 - 3), (x1 + 4, y0 - 3), (x0 - 4, y1 + 3), (x1 + 4, y1 + 3)]
    best = None
    for sx, sy in starts:
        st = np.array([sx, sy], float)
        for th in range(0, 360, 2):
            u = np.array([np.cos(np.radians(th)), np.sin(np.radians(th))])
            r = TP.ray_run(A3, st, u, maxlen=300)
            if r >= min_run and (best is None or r > best[0]):
                best = (r, st + u * r)
    return None if best is None else best[1]


def overlaps(b, boxes):
    for c in boxes:
        ix = min(b[2], c[2]) - max(b[0], c[0]); iy = min(b[3], c[3]) - max(b[1], c[1])
        if ix > 0 and iy > 0 and ix * iy > 0.3 * min((b[2] - b[0]) * (b[3] - b[1]), (c[2] - c[0]) * (c[3] - c[1])):
            return True
    return False


def annotation_mask(lab, un):
    """SSB's mask drops every white pixel within 3 px of bright bone, which also drops arrowheads lying on
    dense bone (cochlear capsule). Here a white pixel counts when the labelled slice is brighter than
    its unlabelled twin (the annotation was drawn on top), whatever the bone level."""
    return EX.annotation_mask(lab, un) | ((lab >= 235) & ((lab.astype(np.int16) - un) >= 6))


def analyse(lab_path, unlab_path):
    lab, un = EX.gray(lab_path), EX.gray(unlab_path)
    mask = annotation_mask(lab, un)
    labels = ocr_page(lab, un)
    for t in labels:
        t['ocr0'] = t['text']
        t['text'] = reocr(lab, t['box']).strip() or t['text']
        t['recovered'] = False
    recovered_total = 0
    for _round in range(2):
        A = mask.copy()
        for t in labels:
            x0, y0, x1, y1 = t['box']
            A[max(0, y0 - 2):y1 + 3, max(0, x0 - 2):x1 + 3] = False
        boxes = [t['box'] for t in labels]
        per, orph = TP.assign(A, boxes)
        if not orph or _round == 1:
            break
        A3 = ndi.binary_dilation(A, iterations=1)
        added = 0
        for h in TP.heads(A):
            tipxy = [int(round(h['tip'][0])), int(round(h['tip'][1]))]
            if tipxy not in orph:
                continue
            e = trace_back(A3, h['tip'], h['dir'])
            if e is None:
                continue
            # the label starts at the far end of the shaft; read a window beyond it
            u = -h['dir']
            c = e + u * 18
            win = [int(c[0] - 85), int(c[1] - 14), int(c[0] + 85), int(c[1] + 14)]
            win = [max(0, win[0]), max(0, win[1]), min(511, win[2]), min(511, win[3])]
            g = np.where(mask, lab, 0)
            sub = ocr_window(lab, un, win)
            for t in sub:
                if not overlaps(t['box'], boxes) and t['text']:
                    t['ocr0'] = t['text']; t['recovered'] = True
                    labels.append(t); boxes.append(t['box']); added += 1
        recovered_total += added
        if not added:
            break
    for t, tp in zip(labels, per):
        t['tips'] = tp
        t['arrowless'] = not tp
    labels = merge_lines(labels)
    A3 = ndi.binary_dilation(A, iterations=1)
    for t in labels:
        if not t['tips']:
            e = shaft_from_label(A3, t['box'])
            if e is not None:
                near = [o for o in orph if np.hypot(o[0] - e[0], o[1] - e[1]) <= 14]
                t['tips'] = [near[0] if near else [int(round(e[0])), int(round(e[1]))]]
                t['tip_method'] = 'head' if near else 'shaft-end'
                if near:
                    orph = [o for o in orph if o != near[0]]
                t['arrowless'] = False
    return labels, orph


def ocr_window(lab, un, win):
    """OCR a window of the page (white text only) and return boxes in page coordinates."""
    x0, y0, x1, y1 = win
    txt = (lab[y0:y1, x0:x1] >= 200) & ~ndi.binary_dilation(un[y0:y1, x0:x1] >= 215, iterations=1)
    g = np.where(txt, np.clip((lab[y0:y1, x0:x1].astype(float) - 200) * 255 / 55, 0, 255), 0).astype(np.uint8)
    g = np.asarray(Image.fromarray(g).resize(((x1 - x0) * 3, (y1 - y0) * 3), Image.BICUBIC))
    img = np.pad(np.stack([g] * 3, axis=-1), ((20, 20), (20, 20), (0, 0)))
    res, _ = EX.ocr(img)
    out = []
    for quad, text, conf in res or []:
        q = (np.array(quad) - 20) / 3
        bx0, by0 = q.min(0); bx1, by1 = q.max(0)
        out.append({'text': text.strip(), 'conf': round(float(conf), 3),
                    'box': [int(bx0) + x0, int(by0) + y0, int(bx1) + x0, int(by1) + y0]})
    return out


def main(planes):
    manifest = C.manifest()
    os.makedirs(C.WORK, exist_ok=True)
    for plane in planes:
        rows = []
        for s in manifest[plane]['slices']:
            n = s['n']
            labels, orph = analyse(os.path.join(RAW, plane, f'img{n:02d}lab.jpg'), os.path.join(RAW, plane, f'img{n:02d}.jpg'))
            rows.append({'n': n, 'scout_rect': s['scout_rect'], 'labels': labels, 'orphan_heads': orph})
        nl = sum(len(r['labels']) for r in rows)
        nt = sum(len(t['tips']) for r in rows for t in r['labels'])
        aw = sum(t['arrowless'] for r in rows for t in r['labels'])
        rec = sum(t['recovered'] for r in rows for t in r['labels'])
        orp = sum(len(r['orphan_heads']) for r in rows)
        empty = [r['n'] for r in rows if not r['labels']]
        print(f'{plane}: {len(rows)} slices, {nl} labels ({rec} recovered from an orphan arrow), {nt} tips, {aw} arrowless labels, {orp} orphan arrowheads; slices with no label: {empty}', flush=True)
        json.dump(rows, open(os.path.join(C.WORK, f'slices-{plane}.json'), 'w'), indent=1)


if __name__ == '__main__':
    main(sys.argv[1:] or list(C.PLANES))
