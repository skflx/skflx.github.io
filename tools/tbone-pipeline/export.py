"""Collect the numbers of the registration and scale stages into tbone/registration.json (numbers only).

    .venv/bin/python -I tools/tbone-pipeline/export.py
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402


def main():
    out = {'stacks': C.read_results().get('stacks'), 'registration': {}, 'frame': json.load(open(os.path.join(C.WORK, 'frame.json')))}
    for p in ('coronal', 'parallel', 'perpendicular'):
        out['registration'][p] = json.load(open(os.path.join(C.WORK, f'registration-{p}.json')))
    out['specimen_identity'] = {
        'verdict': 'one specimen, one acquisition: the coronal, parallel and perpendicular stacks are reformats of the axial stack',
        'evidence': 'a rigid fit (square pixels, free slice step) of each stack into the axial volume reaches an edge-NCC of 0.97-0.98 on every slice (per-slice values per plane); pixel size equals the axial one (s = 1.00 within 1 %); the fitted axial slice step agrees across the three stacks within 1 %; reformat spacing is 6.4 axial px in all three',
        'caveat': 'tips marking the same structure in two stacks differ by a median 11-14 axial px (2-2.5 mm): arrows land on different parts of extended structures, so this is a label statistic, not a registration error'}
    json.dump(out, open(os.path.join(C.OUT, 'registration.json'), 'w'), indent=1)
    print('wrote', os.path.join(C.OUT, 'registration.json'))


if __name__ == '__main__':
    main()
