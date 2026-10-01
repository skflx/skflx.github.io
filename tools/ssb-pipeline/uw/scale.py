"""Physical scale (mm per axial display pixel) for the UW axial/sagittal volume (stage A).

    .venv/bin/python tools/ssb-pipeline/uw/scale.py          # after volume.py and register.py

Three independent lines of evidence, written to the "scale" section of registration.json:

1. Acquisition geometry. The axial captures carry a circular reconstruction mask (outside it
   the padding value shows black while air inside shows grey), i.e. the circle inscribed in
   the reconstruction matrix, whose diameter is the display FOV. Together with the fitted
   axial slice spacing and sagittal slice step (register.py) this admits one combination of
   round scanner values; the others are listed for comparison.
2. The globes (the calibration the spec asks for): external AP length and transverse width
   from intensity profiles, both eyes, several axial slices through the lens (globes()).
   A 3D sphere fit was tried in development and dropped: it latched onto the muscle cone
   and read 83-88 px, well outside the profile widths.
3. Other anatomy: dens (C1 level) outer diameters and maximum bony cranial breadth.
The anatomy-only estimate combines one measure per structure, inverse-variance weighted by
the population SD of the reference (n = 1 specimen, so the SD is the uncertainty).
"""
import os, sys
import numpy as np
from scipy import ndimage as ndi

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from volume import load, read_results, write_results  # noqa: E402

REFS = {
    'globe': 'Bekerman I, Gottlieb P, Vaiman M. Variations in eyeball diameters of the healthy adults. '
             'J Ophthalmol 2014:503645, doi:10.1155/2014/503645 (CT, n=250): transverse 24.2 mm (range 21-27, '
             'i.e. SD ~1 mm), sagittal 23.7 mm, axial 22.0-24.8 mm',
    'dens': 'Yusof MI et al. J Orthop Surg 2007;15:67, doi:10.1177/230949900701500115: AP 11.3 +/- 0.7, transverse '
            '10.2 +/- 0.8 mm near the base; Choudhary KS et al. Neurol India 2020;68:1361, doi:10.4103/0028-3886.304125: '
            'transverse 8.66 mm at the waist, 9.68 mm widest. Level-dependent, CV ~8-10 %',
    'cranial_breadth': 'maximum cranial breadth (euryon-euryon), adults roughly 130-150 mm; sex- and '
                       'population-dependent (CV ~4-5 %). Weak check only',
}


def geometry(res):
    r = res['stacks']['axial']['fov_circle']['r'][0]
    sag = res['registration']['sagittal']
    dz = sag['params']['dz']
    step = sag['slice_step_along_normal_axial_px']
    D = 2 * r
    rows = []
    for t in (0.5, 0.6, 0.625, 0.67, 0.75, 0.8, 1.0, 1.25):
        px = t / dz
        rows.append({'axial_spacing_mm': t, 'mm_per_px': round(px, 5), 'implied_dfov_mm': round(D * px, 2),
                     'implied_sagittal_step_mm': round(step * px, 4)})
    best = min(rows, key=lambda o: abs(o['implied_dfov_mm'] / 10 - round(o['implied_dfov_mm'] / 10))
               + abs(o['implied_sagittal_step_mm'] * 4 - round(o['implied_sagittal_step_mm'] * 4)))
    return {'fov_circle_diameter_px': round(D, 3), 'axial_dz_px': dz, 'sagittal_step_px': step,
            'sagittal_to_axial_spacing_ratio': round(step / dz, 5), 'candidates': rows, 'best': best,
            'mm_per_px_from_dfov_180': round(180.0 / D, 5)}


# ---------------------------------------------------------------- globes
def _ring_edges(prof, c, lo=22, hi=48):
    """Outer edges of the bright scleral ring either side of index c: outward half-level
    crossing between the ring peak and the vitreous level (sub-pixel)."""
    vit = np.median(prof[c - 15:c + 16])
    out = []
    for sgn in (-1, 1):
        idx = np.arange(c + sgn * lo, c + sgn * hi, sgn)
        pk = idx[np.argmax(prof[idx])]
        level = (prof[pk] + vit) / 2
        j = pk
        while 0 < j < len(prof) - 1 and prof[j] >= level:
            j += sgn
        a, b = prof[j - sgn], prof[j]
        out.append(j - sgn + sgn * (a - level) / (a - b + 1e-6))
    return out


def globes(ns=range(69, 80, 2)):
    """Per eye, per axial slice through the lens region: external AP length along the optic
    axis column (air->cornea half-level to outer scleral edge; clean boundaries) and the
    transverse outer scleral width over the 9 rows round the centre (median; the medial and
    lateral recti and the lids abut the sclera here, so this one is noisier).
    Centres (x, y) were read off the lens slices; image-left/right, not patient side."""
    A = load('axial').astype(np.float32)
    out = {}
    for name, (cx, cy) in (('image_left', (164, 108)), ('image_right', (335, 98))):
        ap, tr = [], []
        for n in ns:
            g = ndi.gaussian_filter(A[n], 1.0)
            col = g[:, cx]
            front = next(i for i in range(cy - 60, cy) if col[i] > (45 + 110) / 2)
            ap.append(round(float(_ring_edges(col, cy)[1] - front), 1))
            w = [np.subtract(*_ring_edges(g[y], cx)[::-1]) for y in range(cy - 4, cy + 5)]
            tr.append(round(float(np.median(w)), 1))
        out[name] = {'axial_slices': [n + 1 for n in ns], 'ap_px': ap, 'transverse_px': tr}
    return out


# ---------------------------------------------------------------- other anatomy
def dens(ns=range(163, 171), seed=(253, 322)):
    A = load('axial')
    out = []
    for n in ns:
        g = ndi.gaussian_filter(A[n].astype(np.float32), 1.0)
        m = ndi.binary_fill_holes(g > 150)
        lab, _ = ndi.label(m)
        l = lab[seed[1], seed[0]]
        if not l:
            continue
        ys, xs = np.nonzero(lab == l)
        w, h = np.ptp(xs) + 1, np.ptp(ys) + 1
        if 15 < w < 40 and 15 < h < 45:
            out.append((n + 1, int(w), int(h)))
    return out


def cranial_breadth(ns=range(0, 80, 2)):
    A = load('axial')
    best = (0, None)
    for n in ns:
        m = ndi.gaussian_filter(A[n].astype(np.float32), 1.0) > 165
        for y in range(0, m.shape[0], 2):
            xs = np.nonzero(m[y])[0]
            if len(xs) > 2 and np.ptp(xs) > best[0]:
                best = (int(np.ptp(xs)), n + 1)
    return {'max_bony_breadth_px': best[0], 'at_axial_slice': best[1]}


def main():
    res = read_results()
    geo = geometry(res)
    px = geo['best']['mm_per_px']
    gl = globes()
    ap = np.array([v for g in gl.values() for v in g['ap_px']])
    tr = np.array([v for g in gl.values() for v in g['transverse_px']])
    dn = dens()
    cb = cranial_breadth()
    dw = float(np.median([d[1] for d in dn])); dh = float(np.median([d[2] for d in dn]))
    # anatomy-only estimates: (reference mm +/- population SD) / measured px
    est = {
        'globe_ap': (23.4, 1.0, float(np.median(ap))),          # Bekerman axial 22.0-24.8 mm
        'globe_transverse': (24.2, 1.0, float(np.median(tr))),   # Bekerman transverse, range 21-27
        'dens_transverse': (9.7, 0.8, dw),                       # Choudhary widest 9.68; Yusof 10.2 +/- 0.8
        'dens_ap': (10.9, 0.8, dh),                              # Yusof 11.3 +/- 0.7 (m), 10.9 +/- 0.8 (f)
        'cranial_breadth': (140.0, 7.0, float(cb['max_bony_breadth_px'])),
    }
    anat = {k: {'ref_mm': m, 'ref_sd_mm': sd, 'measured_px': round(v, 2), 'mm_per_px': round(m / v, 4),
                'sd_mm_per_px': round(sd / v, 4), 'mm_at_adopted': round(v * px, 2)} for k, (m, sd, v) in est.items()}
    # combine the least-contaminated measures (globe AP, dens transverse, cranial breadth; one per structure)
    use = ['globe_ap', 'dens_transverse', 'cranial_breadth']
    wts = np.array([1 / anat[k]['sd_mm_per_px'] ** 2 for k in use]); vals = np.array([anat[k]['mm_per_px'] for k in use])
    comb = float((wts * vals).sum() / wts.sum()); comb_sd = float(1 / np.sqrt(wts.sum()))
    out = {'adopted_mm_per_px': px, 'adopted_basis': 'acquisition geometry (geometry.best)',
           'uncertainty_mm_per_px': 0.0005,
           'uncertainty_note': 'conditional on the scanner values being the round ones geometry.best names; '
                               'anatomy alone gives anatomy_only below',
           'anatomy_only_mm_per_px': [round(comb, 4), round(comb_sd, 4)], 'anatomy_only_uses': use,
           'geometry': geo,
           'globes': {**gl, 'ap_px_median_range': [float(np.median(ap)), float(ap.min()), float(ap.max())],
                      'transverse_px_median_range': [float(np.median(tr)), float(tr.min()), float(tr.max())]},
           'dens_px_per_slice_w_h': dn, 'cranial_breadth': cb, 'anatomy': anat, 'references': REFS,
           'derived_mm': {'axial_slice_spacing': round(geo['axial_dz_px'] * px, 4),
                          'sagittal_slice_spacing': round(geo['sagittal_step_px'] * px, 4),
                          'sagittal_pixel': round(res['registration']['sagittal']['pixel_axial_px'] * px, 5)}}
    for k2, v in anat.items():
        print(k2, v)
    print('anatomy-only', out['anatomy_only_mm_per_px'], '| geometry best', geo['best'], '| derived', out['derived_mm'])
    write_results('scale', out)


if __name__ == '__main__':
    main()
