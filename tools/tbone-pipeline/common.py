"""Shared paths and loaders for the temporal-bone pipeline. Generic helpers of the SSB pipeline
(tools/ssb-pipeline/uw/: boneness, circle fit, NCC, Powell, annotation mask) are loaded from there
unchanged under their own module names, so nothing is copied and nothing collides with this folder.

Array conventions (every script):
  axial          V[n, y, x]  n = slice (0 = img01, superior), y = row, x = column  (image as shown)
  coronal/parallel/perpendicular  V[k, v, u]  k = slice (0 = img01), v = row, u = column
"""
import importlib.util, json, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'incoming', 'uw-temporalbone')
CACHE = os.path.join(RAW, '_recon')
WORK = os.path.join(HERE, 'work')
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(REPO, 'tbone')
PLANES = ('axial', 'coronal', 'parallel', 'perpendicular')
SSB_UW = os.path.join(REPO, 'tools', 'ssb-pipeline', 'uw')

_mods = {}


def ssb(name):
    """Load tools/ssb-pipeline/uw/<name>.py as module 'ssb_<name>' (cached)."""
    if name not in _mods:
        sys.path.insert(0, SSB_UW)   # the SSB modules import each other (volume, register) by bare name
        try:
            spec = importlib.util.spec_from_file_location('ssb_' + name, os.path.join(SSB_UW, name + '.py'))
            m = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(m)
        finally:
            sys.path.remove(SSB_UW)
        _mods[name] = m
    return _mods[name]


def manifest():
    return json.load(open(os.path.join(RAW, 'manifest.json')))


def load(plane):
    """Unlabeled stack as uint8 (N, H, W), cached as .npy under incoming/."""
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, plane + '.npy')
    if os.path.exists(path):
        return np.load(path)
    rows = manifest()[plane]['slices']
    V = np.stack([np.asarray(Image.open(os.path.join(RAW, plane, f"img{s['n']:02d}.jpg")).convert('L')) for s in rows])
    np.save(path, V)
    return V


def boneness(V):
    return ssb('volume').boneness(V)


def results_path():
    return os.path.join(WORK, 'registration.json')


def read_results():
    p = results_path()
    return json.load(open(p)) if os.path.exists(p) else {}


def write_results(section, data):
    os.makedirs(WORK, exist_ok=True)
    out = read_results()
    out[section] = data
    json.dump(out, open(results_path(), 'w'), indent=1)


def load_ct():
    """The committed display volume tbone/ct: (V[z, y, x] uint8, spacing mm, origin mm of voxel [0,0,0], meta)."""
    import gzip
    meta = json.load(open(os.path.join(OUT, 'ct', 'ct.json')))
    nx, ny, nz = meta['dims']
    V = np.frombuffer(gzip.open(os.path.join(OUT, 'ct', 'ct.u8.gz')).read(), np.uint8).reshape(nz, ny, nx)
    return V, meta['spacing_mm'], np.array(meta['origin_mm'], float), meta


def load_source():
    """tbone/ct/source.u8.gz on the ct grid: 0 no data, 1 axial stack, 2 reformatted stacks only."""
    import gzip
    meta = json.load(open(os.path.join(OUT, 'ct', 'ct.json')))
    nx, ny, nz = meta['dims']
    return np.frombuffer(gzip.open(os.path.join(OUT, 'ct', 'source.u8.gz')).read(), np.uint8).reshape(nz, ny, nx)
