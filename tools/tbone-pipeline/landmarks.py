"""Every UW label -> a 3D point per arrow tip (WP T3).

    .venv/bin/python -I tools/tbone-pipeline/landmarks.py     # -> tbone/geometry/landmarks.json

A tip is a pixel (u, v) on slice k of one stack. Axial tips are used as they are; tips of the coronal,
parallel and perpendicular stacks are mapped into axial voxel space by the fitted registrations
(register.py) and then into the OLSB frame (mm; x lateral, y anterior, z superior; origin = centre of the
oval window) with geom.px_to_mm. UW keeps a label on a run of consecutive slices while the structure
runs through them; a tip pixel repeated on a run is one tip, placed at the middle slice of the run
(`slices` records the run, so a vertical structure such as the petrous ICA is not mistaken for a point).

Each record: id, name (this pipeline's canonical label), text (as read from the image), g (the
js/olsb/glossary.js id where one fits, else null), plane, slices [first, last] (UW numbers, 1-based),
tip_px, point_mm, confidence (OCR), how (the tip finder: 'head' = isolated arrowhead, 'shaft-end' =
fallback), label_tips (how many tips share this label text on the slice).
`summary` per name: tips, planes, median point, and the spread (sd, mm) over the per-plane medians, a
measure of how well the planes agree on that structure (arrows land on different parts of extended
structures, so spread is not registration error alone).
"""
import json, os, re, sys
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402
import geom as G  # noqa: E402


def glossary_ids():
    src = open(os.path.join(C.REPO, 'js', 'olsb', 'glossary.js')).read()
    return set(re.findall(r'^\s{8}"([a-z0-9-]+)":\s*\{', src, re.M))


def main():
    fr = G.frame()
    gids = glossary_ids()
    sl = G.slices()
    recs = []
    sl_by_key = {}
    for plane, rows in sl.items():
        for r in rows:
            for t in r['labels']:
                for tip in t['tips']:
                    sl_by_key[(plane, r['n'], t['text'], tuple(tip))] = t.get('tip_method', 'head')
    out = []
    unknown = {}
    for rec in G.grouped_tips(sl):
        x, y, n = G.tip_axial(rec)
        mm = G.px_to_mm(x, y, n, fr)
        g = rec['g'] if rec['g'] in gids else None
        if rec['canon'] is None:
            unknown[rec['text']] = unknown.get(rec['text'], 0) + 1
        how = sl_by_key.get((rec['plane'], rec['n_first'], rec['text'], tuple(rec['tip'])), 'head')
        out.append({'id': f"{rec['canon'] or 'unknown'}.{rec['plane'][:3]}.{rec['n_first']}-{rec['n_last']}.{len(out)}",
                    'name': rec['canon'], 'text': rec['text'], 'g': g, 'plane': rec['plane'],
                    'slices': [rec['n_first'], rec['n_last']], 'tip_px': rec['tip'],
                    'point_mm': [round(v, 2) for v in mm], 'confidence': rec['conf'], 'how': how,
                    'label_tips': rec['n_tips_on_label']})
    by = {}
    for r in out:
        if r['name']:
            by.setdefault(r['name'], {}).setdefault(r['plane'], []).append(r['point_mm'])
    summary = {}
    for k, d in sorted(by.items()):
        allp = np.array([p for v in d.values() for p in v])
        meds = np.array([np.median(v, 0) for v in d.values()])
        summary[k] = {'tips': int(len(allp)), 'planes': sorted(d), 'median_mm': [round(float(v), 2) for v in np.median(allp, 0)],
                      'plane_spread_sd_mm': round(float(np.sqrt(meds.var(0).sum())), 2) if len(meds) > 1 else None}
    doc = {'frame': 'OLSB: mm, right ear, x lateral, y anterior, z superior; (0,0,0) = centre of the oval window',
           'scale': {k: fr[k] for k in ('s_mm_per_px', 's_relative_uncertainty', 'dz_mm')},
           'source': 'UW Interactive CT Temporal Bone atlas, normal; labels read from the labelled slices, tips by arrowhead (tools/tbone-pipeline/extract.py, tips.py)',
           'note': 'a tip marks a place on a structure, not its centroid; sweeps.json holds the traced centrelines',
           'unreadable_labels': unknown, 'summary': summary, 'landmarks': out}
    os.makedirs(os.path.join(C.OUT, 'geometry'), exist_ok=True)
    json.dump(doc, open(os.path.join(C.OUT, 'geometry', 'landmarks.json'), 'w'), separators=(',', ':'))
    print(len(out), 'landmarks;', len(summary), 'names;', 'unreadable', unknown)
    print('glossary ids used:', sorted({r['g'] for r in out if r['g']}))


if __name__ == '__main__':
    main()
