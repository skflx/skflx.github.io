"""Reapply vocab.py to the committed tbone/geometry/landmarks.json without re-registering.

    .venv/bin/python -I tools/tbone-pipeline/relabel.py [--check]

For every landmark the canonical `name` and glossary id `g` are recomputed from its raw `text` with the
current vocab.py rules (g kept only if it is a key of js/olsb/glossary.js, as landmarks.py does), then the
`summary` (per-name statistics of the unchanged `point_mm`) and `unreadable_labels` are rebuilt the same way.
Tips, points, confidences and every landmark `id` stay as they are (ids carry the old canon as a prefix and
are references, not names). The file is written in landmarks.py's format, so the diff is only what the
vocabulary changed. Use this after editing vocab.py when a full rerun would also redo the registration.
Prints every landmark whose name or g changed.
"""
import json, os, sys
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402
import vocab  # noqa: E402
from landmarks import glossary_ids  # noqa: E402

PATH = os.path.join(C.OUT, 'geometry', 'landmarks.json')


def main():
    doc = json.load(open(PATH))
    gids = glossary_ids()
    changed, unknown = [], {}
    for r in doc['landmarks']:
        cid, gid = vocab.canon(r['text'])
        gid = gid if gid in gids else None
        if cid is None:
            unknown[r['text']] = unknown.get(r['text'], 0) + 1
        if (cid, gid) != (r['name'], r['g']):
            changed.append((r['id'], r['text'], r['plane'], (r['name'], r['g']), (cid, gid)))
            r['name'], r['g'] = cid, gid
    by = {}
    for r in doc['landmarks']:
        if r['name']:
            by.setdefault(r['name'], {}).setdefault(r['plane'], []).append(r['point_mm'])
    summary = {}
    for k, d in sorted(by.items()):
        allp = np.array([p for v in d.values() for p in v])
        meds = np.array([np.median(v, 0) for v in d.values()])
        summary[k] = {'tips': int(len(allp)), 'planes': sorted(d), 'median_mm': [round(float(v), 2) for v in np.median(allp, 0)],
                      'plane_spread_sd_mm': round(float(np.sqrt(meds.var(0).sum())), 2) if len(meds) > 1 else None}
    doc['summary'], doc['unreadable_labels'] = summary, unknown
    for c in changed:
        print('changed', c)
    if '--check' in sys.argv:
        sys.exit(1 if changed else 0)
    json.dump(doc, open(PATH, 'w'), separators=(',', ':'))
    print(len(changed), 'landmarks relabelled')


if __name__ == '__main__':
    main()
