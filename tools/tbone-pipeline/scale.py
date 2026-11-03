"""Scale and frame (WP T2, T5): mm per pixel, slice step in mm, and the oval-window origin.

    .venv/bin/python -I tools/tbone-pipeline/scale.py            # writes work/frame.json
    .venv/bin/python -I tools/tbone-pipeline/scale.py report     # after sweeps.py: anatomy cross-checks of the scale

The atlas is a screen capture of a bone-window display, not DICOM, so no pixel spacing is stored.

In-plane mm/px, s. Prior: the axial frames are a circular field of view filling the 512-px image
(volume.py check: circle radius 255.85 px, centre 255.5), so s = FOV / 512, and a dedicated temporal-bone
protocol uses a FOV of 80-100 mm (s = 0.156-0.195 mm/px). The FOV is not recorded in the capture, so s is
inferred, never measured, from anatomy of known size (`report`, on the traced sweeps, textbook lengths):
IAC length, the three facial-nerve segment lengths, the cochlear basal-turn diameter. First pass at a
100 mm FOV (s = 0.195) gave implied values of 0.106-0.186 (median 0.169): every check said the nominal
value was too large, the well-defined ones (IAC, mastoid segment, cochlea A) agree on 0.169-0.186. The
labyrinthine and tympanic segments are short, their ends are not labelled precisely and their tips
scatter by ~1.5 mm, so they are weak checks (they imply 0.11-0.12). The value kept is the round FOV that
sits inside that spread, 90 mm (s = 0.1758), and the uncertainty is stated as +-10 % (one sigma). The
check is therefore not independent of the choice, only a consistency test; `report` prints every implied
value at the kept scale so a reviewer can judge it.

Slice step, dz_mm. Registration (register.py) fits the axial slice step in axial pixels independently
in each reformatted stack (they share the specimen; their fits agree to ~1 %), so dz_mm = dz_px * s: no
separate prior is needed, and its relative uncertainty equals that of s.

Origin. The centre of the oval window is the median of the UW 'oval window' tips of all four stacks,
mapped into axial voxel space by the fitted registrations (the spread is reported).
"""
import json, os, sys
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402
import geom as G  # noqa: E402

S_NOMINAL = 90.0 / 512   # mm/px: a 90 mm field of view over 512 px (see the docstring: chosen after the first checks)
S_REL_UNC = 0.10


def origin():
    pts, per = [], {}
    for rec in G.grouped_tips():
        if rec['canon'] != 'oval-window':
            continue
        x, y, n = G.tip_axial(rec)
        pts.append((x, y, n)); per.setdefault(rec['plane'], []).append((round(x, 1), round(y, 1), round(n, 1)))
    P = np.array(pts)
    med = np.median(P, 0)
    # a tip well away from the others is a mislink (axial slice 37's tip lies 65 px lateral of the rest)
    d = np.sqrt(((P[:, 0] - med[0]) ** 2 + (P[:, 1] - med[1]) ** 2) + ((P[:, 2] - med[2]) * 1.6) ** 2)
    keep = d < max(3 * np.median(d), 12)
    med2 = np.median(P[keep], 0)
    return med2, {'n_tips': int(len(P)), 'n_kept': int(keep.sum()), 'per_plane_axial_xyn': per,
                  'spread_px_sd': [round(float(v), 2) for v in P[keep].std(0)]}


def main():
    dzs = []
    for plane in ('coronal', 'parallel', 'perpendicular'):
        dzs.append(G.reg_params(plane)[10])
    dz_px = float(np.mean(dzs))
    org, info = origin()
    s = S_NOMINAL
    fr = {'s_mm_per_px': s, 's_relative_uncertainty': S_REL_UNC,
          's_method': 'prior: circular axial FOV filling 512 px, nominal temporal-bone FOV 100 mm; cross-checked against anatomy of known size (scale.py report); NOT a measurement of pixel spacing',
          'dz_px_axial_fits': [round(v, 4) for v in dzs], 'dz_px': round(dz_px, 4),
          'dz_mm': round(dz_px * s, 4), 'dz_method': 'slice step in axial pixels fitted by registering the coronal, parallel and perpendicular stacks (agree within ~1 %), times s',
          'origin_px': [round(float(v), 3) for v in org], 'origin_info': info,
          'origin_method': 'median of the UW oval-window tips of all four stacks mapped into axial voxel space (px x, px y, fractional 0-based slice n)'}
    os.makedirs(C.WORK, exist_ok=True)
    json.dump(fr, open(os.path.join(C.WORK, 'frame.json'), 'w'), indent=1)
    print(json.dumps(fr, indent=1))


def report():
    """Implied scale from each anatomical dimension measured on the sweeps (sweeps.py writes work/dims.json:
    name -> {measured_mm at the provisional scale, expected_mm, tol_mm, source})."""
    fr = G.frame()
    dims = json.load(open(os.path.join(C.WORK, 'dims.json')))
    rows = []
    for k, d in dims.items():
        implied = fr['s_mm_per_px'] * d['expected_mm'] / d['measured_mm']
        rows.append((k, d['measured_mm'], d['expected_mm'], implied))
        print(f"{k:38s} measured {d['measured_mm']:6.2f} mm  expected {d['expected_mm']:5.1f} +-{d['tol_mm']}  implied s = {implied:.3f}")
    imp = np.array([r[3] for r in rows])
    print(f"median implied s = {np.median(imp):.3f} (nominal {fr['s_mm_per_px']}), spread (MAD*1.48) {1.4826 * np.median(abs(imp - np.median(imp))):.3f}, n = {len(imp)}")
    fr['cross_checks'] = [{'name': r[0], 'measured_mm_at_provisional_s': round(r[1], 2), 'expected_mm': r[2], 'implied_s': round(r[3], 3)} for r in rows]
    fr['cross_check_median_s'] = round(float(np.median(imp)), 4)
    fr['cross_check_spread_s'] = round(float(1.4826 * np.median(abs(imp - np.median(imp)))), 4)
    json.dump(fr, open(os.path.join(C.WORK, 'frame.json'), 'w'), indent=1)


if __name__ == '__main__':
    report() if len(sys.argv) > 1 and sys.argv[1] == 'report' else main()
