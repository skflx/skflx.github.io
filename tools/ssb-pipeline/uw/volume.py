"""UW stacks -> cached 8-bit volumes + stack-consistency checks (reconstruction stage A).

    .venv/bin/python tools/ssb-pipeline/uw/volume.py

Reads the unlabeled frames fetched by fetch.py (incoming/, gitignored), caches one
uint8 volume per plane in incoming/uw-sinusanatomy2/_recon/ (never committed), and
writes the "stacks" section of registration.json: is the framing identical slice
to slice, and are the scout bands evenly stepped?

Array conventions used by every recon script:
  axial    V[n, y, x]  n = slice (0 = img001, superior), y = row (0 = anterior), x = column
  coronal  V[k, v, u]  k = slice (0 = img001, anterior),  v = row (0 = superior), u = column
  sagittal V[j, v, u]  j = slice (0 = img001),             v = row (0 = superior), u = column (0 = anterior)
"""
import json, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, '..', 'incoming', 'uw-sinusanatomy2')
CACHE = os.path.join(RAW, '_recon')
RESULTS = os.path.join(HERE, 'registration.json')
PLANES = ('axial', 'coronal', 'sagittal')


def manifest():
    return json.load(open(os.path.join(RAW, 'manifest.json')))


def load(plane):
    """Unlabeled stack as uint8 (N, H, W); cached as .npy under incoming/."""
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, plane + '.npy')
    if os.path.exists(path):
        return np.load(path)
    rows = manifest()['atlas'][plane]['slices']
    V = np.stack([np.asarray(Image.open(os.path.join(RAW, s['img'])).convert('L')) for s in rows])
    np.save(path, V)
    return V


def levels(V):
    """(soft-tissue mode, bone reference) of one stack's display window. Each stack was
    captured with its own window/level, so features are normalised per stack."""
    h = np.bincount(V.ravel(), minlength=256).astype(float)
    h[:12] = 0
    soft = int(np.argmax(ndi.gaussian_filter1d(h, 2)))
    hi = float(np.percentile(V[V > soft + 25], 99.5))
    return soft, hi


def boneness(V):
    """0 at soft tissue, 1 at dense bone. Between those levels every window is linear in HU,
    so bone edges are comparable across stacks up to a scale factor NCC ignores."""
    soft, hi = levels(V)
    return np.clip((V.astype(np.float32) - soft) / (hi - soft), 0, 1.2)


def read_results():
    return json.load(open(RESULTS)) if os.path.exists(RESULTS) else {}


def write_results(section, data):
    out = read_results()
    out[section] = data
    json.dump(out, open(RESULTS, 'w'), indent=1)


def fit_circle(xs, ys):
    A = np.c_[2 * xs, 2 * ys, np.ones_like(xs)]
    c = np.linalg.lstsq(A, xs ** 2 + ys ** 2, rcond=None)[0]
    r = np.sqrt(c[2] + c[0] ** 2 + c[1] ** 2)
    return c[0], c[1], r, float(np.abs(np.hypot(xs - c[0], ys - c[1]) - r).mean())


def axial_fov(V):
    """Per-slice least-squares circle through the black-corner boundary of the axial FOV."""
    out = []
    for g in V:
        m = ndi.binary_fill_holes(g > 20)
        b = m & ~ndi.binary_erosion(m)
        b[0, :] = b[-1, :] = b[:, 0] = b[:, -1] = False
        ys, xs = np.nonzero(b)
        out.append(fit_circle(xs.astype(float), ys.astype(float)))
    return np.array(out)


def adjacent_shifts(V):
    """In-plane shift between consecutive slices (phase correlation on bone edges). A pan or
    re-crop between captures shows up as an outlier or a trend; anatomy alone gives noise."""
    from skimage.registration import phase_cross_correlation
    B = boneness(V)
    E = [ndi.gaussian_gradient_magnitude(b, 1.5) for b in B]
    sh = [phase_cross_correlation(E[i], E[i + 1], upsample_factor=4, normalization=None)[0] for i in range(len(E) - 1)]
    return np.array(sh)


def scout_steps(plane):
    rows = manifest()['atlas'][plane]['slices']
    r = np.array([s['scout_rect'] for s in rows], float)
    axis = 1 if plane == 'axial' else 0       # axial bands are rows on the AP scout; others are columns
    lo, hi = r[:, axis], r[:, axis + 2]
    c = (lo + hi) / 2
    n = np.arange(len(c))
    p = np.polyfit(n, c, 1)
    res = c - np.polyval(p, n)
    return {'scout': manifest()['atlas'][plane]['scout'], 'band_axis': 'rows' if axis else 'columns',
            'step_px': round(float(p[0]), 4), 'band_width_px': [int(np.min(hi - lo)), int(np.max(hi - lo))],
            'max_abs_residual_px': round(float(np.abs(res).max()), 3),
            'span_px': [float(lo.min()), float(hi.max())],
            'note': 'bands tile the whole scout image evenly (a hover map), so they encode an even-spacing '
                    'assumption and slice order, not measured positions'}


def main():
    stacks = {}
    for plane in PLANES:
        V = load(plane)
        soft, hi = levels(V)
        info = {'slices': int(V.shape[0]), 'size_wh': [int(V.shape[2]), int(V.shape[1])],
                'window': {'soft_tissue_level': soft, 'bone_p99.5': hi, 'max': int(V.max())},
                'scout': scout_steps(plane)}
        sh = adjacent_shifts(V)
        mag = np.hypot(sh[:, 0], sh[:, 1])
        info['adjacent_slice_shift_px'] = {
            'median': round(float(np.median(mag)), 3), 'p95': round(float(np.percentile(mag, 95)), 3),
            'max': round(float(mag.max()), 3), 'cumulative_drift_rc': [round(float(v), 2) for v in sh.sum(0)],
            'note': 'phase correlation of consecutive slices; anatomy changes add noise, a pan would add a jump'}
        if plane == 'axial':
            C = axial_fov(V)
            info['fov_circle'] = {'cx': [round(float(C[:, 0].mean()), 2), round(float(C[:, 0].std()), 3)],
                                  'cy': [round(float(C[:, 1].mean()), 2), round(float(C[:, 1].std()), 3)],
                                  'r': [round(float(C[:, 2].mean()), 2), round(float(C[:, 2].std()), 3)],
                                  'fit_residual_px': round(float(C[:, 3].mean()), 3),
                                  'note': '[mean, sd] over slices; the FOV circle is burned into every capture'}
        else:
            # content rows: the reformat's superior-inferior extent; air is ~0 in these windows,
            # so use rows where any column is non-black
            rows = [np.nonzero((g > 8).any(1))[0] for g in V]
            top = np.array([r.min() for r in rows if len(r)]); bot = np.array([r.max() for r in rows if len(r)])
            full = [i for i, g in enumerate(V) if (g > 8).mean(0).max() > 0.9]
            info['content_rows'] = {'top': [int(np.median(top)), int(top.min()), int(top.max())],
                                    'bottom': [int(np.median(bot)), int(bot.min()), int(bot.max())],
                                    'slices_used': len(full),
                                    'note': '[median, min, max] first/last non-black row; constant = fixed vertical framing'}
        stacks[plane] = info
        print(plane, json.dumps(info)[:600])
    write_results('stacks', stacks)


if __name__ == '__main__':
    main()
