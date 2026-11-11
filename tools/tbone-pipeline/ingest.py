"""Ingest an NRRD volume into an isotropic working grid (WP B3; spec plans/2026-11-04-tbone-sources.md
B-2, B-6, §6; issue #299).

    python3 -I tools/tbone-pipeline/ingest.py <in.nrrd> --source <id> --spacing 0.3 --out <dir>

numpy and scipy only (no pynrrd, no pydicom). The whole header is read, but only the geometry allowlist
(`geometry()`: dims, spacing_mm, direction, origin, space, dtype) and the source id reach an output; no other header
key or value is written anywhere (B-6). `<dir>` must resolve inside tools/tbone-pipeline/incoming/, which is
git-ignored, so derived volumes never leave it unless the orchestrator says so (B-2).

Array conventions: `read_nrrd` returns an array of shape `sizes` (NRRD order, fastest axis first, so
arr[i, j, k] is the sample at NRRD index (i, j, k)). The output file is that array in Fortran order, x fastest.
A 4D Slicer segmentation has a layer axis first (its space direction is `none`); `read_segments` splits it.
"""
import argparse, gzip, json, os, re, sys, zlib
import numpy as np
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
INCOMING = os.path.join(HERE, 'incoming')

# NRRD type names (lower case, spaces collapsed) -> numpy kind; multi-byte types need `endian`
TYPES = {
    'int8': 'i1', 'int8_t': 'i1', 'signed char': 'i1',
    'uint8': 'u1', 'uint8_t': 'u1', 'unsigned char': 'u1', 'uchar': 'u1',
    'int16': 'i2', 'int16_t': 'i2', 'short': 'i2', 'short int': 'i2', 'signed short': 'i2', 'signed short int': 'i2',
    'uint16': 'u2', 'uint16_t': 'u2', 'ushort': 'u2', 'unsigned short': 'u2', 'unsigned short int': 'u2',
    'int32': 'i4', 'int32_t': 'i4', 'int': 'i4', 'signed int': 'i4',
    'uint32': 'u4', 'uint32_t': 'u4', 'uint': 'u4', 'unsigned int': 'u4',
    'int64': 'i8', 'int64_t': 'i8', 'long': 'i8', 'long int': 'i8', 'signed long': 'i8', 'signed long int': 'i8',
    'uint64': 'u8', 'uint64_t': 'u8', 'ulong': 'u8', 'unsigned long': 'u8', 'unsigned long int': 'u8',
    'float': 'f4', 'float32': 'f4', 'double': 'f8', 'float64': 'f8',
}

# NRRD `space` values accepted by geometry(): a closed vocabulary; anything else is refused and not echoed
SPACES = {
    'left-posterior-superior': 'left-posterior-superior', 'lps': 'left-posterior-superior',
    'right-anterior-superior': 'right-anterior-superior', 'ras': 'right-anterior-superior',
    'left-anterior-superior': 'left-anterior-superior', 'las': 'left-anterior-superior',
    'right-posterior-superior': 'right-posterior-superior', 'rps': 'right-posterior-superior',
}


def _key(k):
    """NRRD field names are case-insensitive, with spaces, underscores and hyphens equivalent."""
    return re.sub(r'[\s_\-]+', ' ', k.strip().lower())


def _field(header, key):
    if key not in header:
        raise ValueError(f'NRRD header has no {key!r} field')
    return header[key]


def _vectors(text):
    """'(a,b,c) none (d,e,f)' -> [array or None, ...]; NRRD vectors are comma-separated inside parentheses."""
    out = []
    for vec, none in re.findall(r'\(([^)]*)\)|(none)', text):
        out.append(None if none else np.array([float(x) for x in vec.split(',')], float))
    return out


def _dtype(header):
    t = _key(header.get('type', ''))
    if t not in TYPES:
        raise ValueError(f'unsupported NRRD type {header.get("type", "")!r}')
    kind = TYPES[t]
    if kind[1] == '1':
        return np.dtype(kind)
    endian = header.get('endian', '').lower()
    if endian not in ('little', 'big'):
        raise ValueError('multi-byte NRRD type without endian little or big')
    return np.dtype(('<' if endian == 'little' else '>') + kind)


def read_nrrd(path):
    """(array of shape `sizes`, header dict). Header keys are normalised (see _key); key:=value pairs included."""
    raw = open(path, 'rb').read()
    if not re.match(rb'NRRD000[1-5]', raw[:8]):
        raise ValueError('not an NRRD file')
    m = re.search(rb'\r?\n\r?\n', raw)
    if not m:
        raise ValueError('NRRD header has no blank line')
    header = {}
    for line in raw[:m.start()].decode('latin-1').splitlines()[1:]:
        if not line.strip() or line.startswith('#'):
            continue
        f = re.match(r'^([^:]+?)(:=|:)(.*)$', line)
        if not f:
            raise ValueError(f'bad NRRD header line {line!r}')
        header[_key(f.group(1))] = f.group(3).strip()
    if 'data file' in header:
        raise ValueError('detached NRRD data files are not supported (single-file NRRD only)')
    for k in ('line skip', 'byte skip'):
        if header.get(k, '0') != '0':
            raise ValueError(f'NRRD {k} is not supported')
    sizes = [int(s) for s in _field(header, 'sizes').split()]
    if int(_field(header, 'dimension')) != len(sizes):
        raise ValueError('NRRD dimension disagrees with sizes')
    dt = _dtype(header)
    body = raw[m.end():]
    enc = header.get('encoding', '').lower()
    if enc in ('gzip', 'gz'):
        data = zlib.decompress(body, 31)
    elif enc == 'raw':
        data = body
    else:
        raise ValueError(f'unsupported NRRD encoding {enc!r} (gzip or raw only)')
    count = int(np.prod(sizes))
    if len(data) != count * dt.itemsize:
        raise ValueError('NRRD data length disagrees with sizes and type')
    arr = np.frombuffer(data, dtype=dt, count=count).reshape(sizes, order='F')
    return arr.astype(dt.newbyteorder('=')), header


def _spatial(header):
    sizes = [int(s) for s in _field(header, 'sizes').split()]
    dirs = _vectors(_field(header, 'space directions'))
    if len(dirs) != len(sizes):
        raise ValueError('space directions disagree with sizes')
    return sizes, dirs


def geometry(header):
    """The header allowlist (B-6): spatial dims, spacing_mm, unit direction rows (one per spatial axis, as NRRD
    lists them), origin, space (closed vocabulary) and dtype. Spacing is read from space directions, never inferred."""
    sizes, dirs = _spatial(header)
    axes = [i for i, d in enumerate(dirs) if d is not None]
    origin = _vectors(_field(header, 'space origin'))[0]
    if origin is None or len(origin) != 3:
        raise ValueError('space origin must be a 3-vector')
    space = SPACES.get(_field(header, 'space').strip().lower())
    if space is None:
        raise ValueError('NRRD space must be left-posterior-superior, right-anterior-superior, '
                         'left-anterior-superior or right-posterior-superior (or LPS, RAS, LAS, RPS); refused')
    norms = [float(np.linalg.norm(dirs[i])) for i in axes]
    if min(norms) == 0:
        raise ValueError('zero-length space direction')
    return {
        'dims': [sizes[i] for i in axes],
        'spacing_mm': norms,
        'direction': [(dirs[i] / n).tolist() for i, n in zip(axes, norms)],
        'origin': [float(x) for x in origin],
        'space': space,
        'dtype': _dtype(header).name,
    }


def read_segments(path):
    """{segment name: boolean 3D mask} for a Slicer .seg.nrrd. A 4D file has a layer axis (space direction `none`).
    4D: layer = Segment<N>_Layer, default N (old Slicer); mask = layer == Segment<N>_LabelValue, default 1.
    3D labelmap: mask = data == Segment<N>_LabelValue (required).
    Names are returned for local measurement only."""
    arr, header = read_nrrd(path)
    _, dirs = _spatial(header)
    layer_axes = [i for i, d in enumerate(dirs) if d is None]
    if len(layer_axes) > 1:
        raise ValueError('more than one layer axis')
    layer_axis = layer_axes[0] if layer_axes else None
    names = {}
    for k, v in header.items():
        f = re.match(r'^segment(\d+) name$', k)
        if f:
            names[f.group(1)] = v
    if not names:
        raise ValueError('no Segment<N>_Name fields: not a Slicer segmentation')
    out = {}
    for n in sorted(names, key=int):
        name = names[n]
        if name in out:
            raise ValueError(f'duplicate segment name {name!r}')
        if layer_axis is not None:
            layer = int(header.get(f'segment{n} layer', n))
            label = int(header.get(f'segment{n} labelvalue', 1))
            out[name] = np.take(arr, layer, axis=layer_axis) == label
        else:
            label = header.get(f'segment{n} labelvalue')
            if label is None:
                raise ValueError(f'segment {n}: 3D labelmap needs Segment{n}_LabelValue')
            out[name] = arr == int(label)
    return out


def resample_iso(vol, spacing_mm, target_mm):
    """Order-1 resampling to isotropic target_mm voxels. grid_mode keeps each voxel centre at its physical
    position. Returns (float32 array, new dims), new dims = round(size * spacing / target).
    Dims are rounded, so the effective spacing can differ from target_mm by a fraction of a percent."""
    new = [int(round(n * s / target_mm)) for n, s in zip(vol.shape, spacing_mm)]
    zoom = [m / n for m, n in zip(new, vol.shape)]
    out = ndi.zoom(vol.astype(np.float32), zoom, order=1, mode='nearest', grid_mode=True)
    if list(out.shape) != new:
        raise RuntimeError(f'resampled shape {out.shape} is not {new}')
    return out, new


def out_dir_inside(out_dir, root=INCOMING):
    """The resolved out_dir, or ValueError unless it lies strictly inside root (symlinks resolved)."""
    real, base = os.path.realpath(out_dir), os.path.realpath(root)
    if real == base or os.path.commonpath([real, base]) != base:
        raise ValueError(f'--out must be a folder inside {root} (raw data stays git-ignored, B-2)')
    return real


def ingest(src, source, target_mm, out_dir, root=INCOMING):
    """Write <out_dir>/volume.i16.gz and meta.json; return (meta, resolved out_dir). Refuses before reading."""
    out = out_dir_inside(out_dir, root)
    if not target_mm > 0:
        raise ValueError('--spacing must be positive')
    vol, header = read_nrrd(src)
    geo = geometry(header)
    if len(geo['dims']) != 3 or vol.ndim != 3:
        raise ValueError('need a 3D spatial volume (a 4D segmentation goes through read_segments)')
    if vol.min() < -32768 or vol.max() > 32767:
        raise ValueError('source values do not fit int16')
    res, new = resample_iso(vol, geo['spacing_mm'], target_mm)
    # grid_mode keeps voxel centres: output voxel 0 sits 0.5*(target - spacing) along each axis from the source origin
    origin_out = np.array(geo['origin']) + sum(np.array(geo['direction'][i]) * 0.5 * (target_mm - geo['spacing_mm'][i]) for i in range(3))
    q = np.clip(np.rint(res), -32768, 32767).astype('<i2')
    os.makedirs(out, exist_ok=True)
    with gzip.GzipFile(os.path.join(out, 'volume.i16.gz'), 'wb', 9, mtime=0) as f:
        f.write(q.ravel(order='F').tobytes())
    meta = {
        'source': source,
        'geometry': {'dims': new, 'spacing_mm': [float(target_mm)] * 3, 'direction': geo['direction'],
                     'origin': [float(x) for x in origin_out], 'space': geo['space'], 'dtype': 'int16'},
        'source_dims': geo['dims'],
        'source_spacing_mm': geo['spacing_mm'],
        'values': {'min': int(q.min()), 'max': int(q.max()),
                   'p01': float(np.percentile(q, 1)), 'p99': float(np.percentile(q, 99))},
    }
    json.dump(meta, open(os.path.join(out, 'meta.json'), 'w'), indent=1)
    return meta, out


def main(argv=None):
    ap = argparse.ArgumentParser(description='Ingest an NRRD volume (allowlisted header only) to an isotropic grid.')
    ap.add_argument('input', help='NRRD file (gzip or raw)')
    ap.add_argument('--source', required=True, help='source id, written to meta.json')
    ap.add_argument('--spacing', type=float, required=True, help='target isotropic voxel size, mm')
    ap.add_argument('--out', required=True, help='output folder inside tools/tbone-pipeline/incoming/')
    a = ap.parse_args(argv)
    try:
        meta, out = ingest(a.input, a.source, a.spacing, a.out)
    except ValueError as e:
        print(f'ingest: refused: {e}', file=sys.stderr)
        return 2
    g, v = meta['geometry'], meta['values']
    print('dims', g['dims'], 'spacing_mm', g['spacing_mm'][0], '(source', meta['source_spacing_mm'], ')')
    print('values min', v['min'], 'max', v['max'], 'p01', v['p01'], 'p99', v['p99'])
    print('output', os.path.getsize(os.path.join(out, 'volume.i16.gz')), 'bytes gz in', out)
    return 0


if __name__ == '__main__':
    sys.exit(main())
