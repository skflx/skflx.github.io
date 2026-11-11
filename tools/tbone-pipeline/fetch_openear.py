"""Download only the needed members of one OpenEar archive (Zenodo record 1473724, CC BY 4.0).

OpenEar ships one multi-GB zip per temporal bone (ZETA.zip, ALPHA.zip, ...). This script reads the
zip's central directory over HTTP Range requests, then streams just the members asked for (default:
CBCT_Unembedded.nrrd and Segmentation.seg.nrrd), one request at a time, so the archive is never
downloaded whole. ZIP64 archives are handled. Each member is CRC32- and size-checked before rename.

Output: tools/tbone-pipeline/incoming/openear/<NAME>/<basename> (git-ignored; never committed)
  python3 tools/tbone-pipeline/fetch_openear.py ZETA --list
  python3 tools/tbone-pipeline/fetch_openear.py ZETA
"""
import argparse, os, re, struct, sys, time, urllib.error, urllib.request, zlib

RECORD = '1473724'
BASE = f'https://zenodo.org/records/{RECORD}/files/'
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'incoming', 'openear')
DEFAULT_MEMBERS = ('CBCT_Unembedded.nrrd', 'Segmentation.seg.nrrd')
UA = 'tbone-pipeline-fetch/1'
BACKOFF = (2, 4, 8, 16)
RETRY_STATUS = (429, 500, 502, 503, 504)
CHUNK = 8 << 20
TAIL = 66 << 10          # EOCD (22 bytes) plus the maximum zip comment (65535) fits in this
U32 = 0xFFFFFFFF


class Fail(Exception):
    pass


def get(url, start, end):
    """One Range request for bytes start..end inclusive. Returns (data, headers)."""
    expected = end - start + 1
    req = urllib.request.Request(url, headers={'Range': f'bytes={start}-{end}', 'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        if r.status != 206:
            raise Fail(f'server answered {r.status}, not 206, to a Range request; refusing to read a full body')
        data = r.read()
        if len(data) != expected:
            raise OSError(f'short read: wanted {expected} bytes, got {len(data)}')
        return data, r.headers


def fetch(url, start, end):
    """get() with retries: 429, 5xx and network errors back off 2, 4, 8, 16 s. Other HTTP errors stop at once."""
    for attempt in range(len(BACKOFF) + 1):
        try:
            return get(url, start, end)
        except urllib.error.HTTPError as e:
            if e.code not in RETRY_STATUS:
                raise Fail(f'HTTP {e.code} {e.reason} for bytes {start}-{end}; headers: {dict(e.headers)}')
            last = f'HTTP {e.code} {e.reason}; headers: {dict(e.headers)}'
        except (OSError, TimeoutError) as e:
            last = repr(e)
        if attempt < len(BACKOFF):
            print(f'  retry in {BACKOFF[attempt]}s after: {last}', file=sys.stderr)
            time.sleep(BACKOFF[attempt])
    raise Fail(f'giving up on bytes {start}-{end}: {last}')


def read_span(url, start, length):
    """length bytes from start, in CHUNK-sized sequential requests."""
    out = bytearray()
    pos = start
    while pos < start + length:
        end = min(pos + CHUNK, start + length) - 1
        data, _ = fetch(url, pos, end)
        out += data
        pos = end + 1
    return bytes(out)


def total_size(url):
    _, headers = fetch(url, 0, 0)
    cr = headers.get('Content-Range', '')
    if '/' not in cr:
        raise Fail(f'no Content-Range in probe response: {dict(headers)}')
    return int(cr.rsplit('/', 1)[1])


def zip64_extra(extra, need):
    """Values of the ZIP64 extra field (0x0001) for the 32-bit fields that are 0xFFFFFFFF, in spec order."""
    p = 0
    while p + 4 <= len(extra):
        tid, tsz = struct.unpack_from('<HH', extra, p)
        body = extra[p + 4:p + 4 + tsz]
        if tid == 1:
            return [struct.unpack_from('<Q', body, 8 * i)[0] for i in range(len(need))]
        p += 4 + tsz
    raise Fail('ZIP64 extra field missing where a 32-bit value is 0xFFFFFFFF')


def read_central_directory(url, size):
    tail_start = max(0, size - TAIL)
    tail, _ = fetch(url, tail_start, size - 1)
    idx = tail.rfind(b'PK\x05\x06')
    if idx < 0:
        raise Fail('no End Of Central Directory record in the last 66 KiB')
    _, _, _, _, n_total, cd_size, cd_off, _ = struct.unpack_from('<4s4HLLH', tail, idx)
    if n_total == 0xFFFF or cd_size == U32 or cd_off == U32:
        loc_pos = tail_start + idx - 20
        loc, _ = fetch(url, loc_pos, loc_pos + 19)
        if loc[:4] != b'PK\x06\x07':
            raise Fail('ZIP64 locator missing')
        rec_off = struct.unpack_from('<4sLQL', loc)[2]
        rec, _ = fetch(url, rec_off, rec_off + 55)
        if rec[:4] != b'PK\x06\x06':
            raise Fail('ZIP64 End Of Central Directory record missing')
        _, _, _, _, _, _, _, n_total, cd_size, cd_off = struct.unpack_from('<4sQHHLLQQQQ', rec)
    cd = read_span(url, cd_off, cd_size)
    entries = []
    pos = 0
    while pos + 46 <= len(cd) and cd[pos:pos + 4] == b'PK\x01\x02':
        (_, _, _, flags, method, _, _, crc, csize, usize, nlen, xlen, clen,
         _, _, _, lho) = struct.unpack_from('<4sHHHHHHLLLHHHHHLL', cd, pos)
        name = cd[pos + 46:pos + 46 + nlen].decode('utf-8' if flags & 0x800 else 'cp437', errors='replace')
        extra = cd[pos + 46 + nlen:pos + 46 + nlen + xlen]
        need = [k for k, v in (('usize', usize), ('csize', csize), ('lho', lho)) if v == U32]
        if need:
            vals = dict(zip(need, zip64_extra(extra, need)))
            usize = vals.get('usize', usize)
            csize = vals.get('csize', csize)
            lho = vals.get('lho', lho)
        entries.append({'name': name, 'method': method, 'crc': crc, 'csize': csize, 'usize': usize, 'lho': lho})
        pos += 46 + nlen + xlen + clen
    if len(entries) != n_total:
        raise Fail(f'central directory holds {len(entries)} entries, expected {n_total}')
    return entries


def extract(url, ent, outdir):
    name = os.path.basename(ent['name'])
    dest = os.path.join(outdir, name)
    if os.path.exists(dest) and os.path.getsize(dest) == ent['usize']:
        print(f'skip {name}: already present ({ent["usize"]} bytes)')
        return dest
    if ent['method'] not in (0, 8):
        raise Fail(f'{ent["name"]}: compression method {ent["method"]} not supported')
    hdr, _ = fetch(url, ent['lho'], ent['lho'] + 29)
    sig, _, _, _, _, _, _, _, _, nlen, xlen = struct.unpack('<4sHHHHHLLLHH', hdr)
    if sig != b'PK\x03\x04':
        raise Fail(f'{ent["name"]}: bad local file header at offset {ent["lho"]}')
    start = ent['lho'] + 30 + nlen + xlen
    end = start + ent['csize']
    d = zlib.decompressobj(-15) if ent['method'] == 8 else None
    part = dest + '.part'
    crc = 0
    written = 0
    t0 = time.time()
    print(f'{name}: {ent["usize"]} bytes ({ent["csize"]} compressed)')
    with open(part, 'wb') as f:
        pos = start
        while pos < end:
            chunk_end = min(pos + CHUNK, end) - 1
            data, _ = fetch(url, pos, chunk_end)
            out = d.decompress(data) if d else data
            crc = zlib.crc32(out, crc)
            written += len(out)
            f.write(out)
            pos = chunk_end + 1
            print(f'  {pos - start:>13} / {ent["csize"]} compressed  ({time.time() - t0:.0f} s)')
        if d:
            out = d.flush()
            crc = zlib.crc32(out, crc)
            written += len(out)
            f.write(out)
    if written != ent['usize']:
        os.remove(part)
        raise Fail(f'{name}: size {written}, expected {ent["usize"]}')
    if (crc & U32) != ent['crc']:
        os.remove(part)
        raise Fail(f'{name}: CRC32 {crc & U32:08x}, expected {ent["crc"]:08x}')
    os.replace(part, dest)
    print(f'  wrote {dest} ({written} bytes, CRC32 {ent["crc"]:08x} OK)')
    return dest


def main():
    ap = argparse.ArgumentParser(description='Fetch selected members of one OpenEar archive (Zenodo 1473724, CC BY 4.0).')
    ap.add_argument('name', help='archive name, e.g. ZETA')
    ap.add_argument('--list', action='store_true', help='print every archive member with sizes and exit')
    ap.add_argument('--members', nargs='+', default=list(DEFAULT_MEMBERS),
                    help='member path suffixes to extract (default: %(default)s)')
    ap.add_argument('--out', default=None, help='output directory (default incoming/openear/<NAME>)')
    args = ap.parse_args()
    if not re.fullmatch(r'[A-Za-z0-9_-]+', args.name):
        ap.error('NAME must be letters, digits, _ or -')
    url = f'{BASE}{args.name}.zip?download=1'
    size = total_size(url)
    entries = read_central_directory(url, size)
    if args.list:
        for e in entries:
            print(f'{e["usize"]:>13} {e["csize"]:>13} {e["method"]:>3}  {e["name"]}')
        print(f'{len(entries)} members; archive {size} bytes')
        return
    wanted = []
    for pat in args.members:
        hits = [e for e in entries if not e['name'].endswith('/')
                and (e['name'] == pat or e['name'].endswith('/' + pat))]
        if not hits:
            raise Fail(f'member {pat} is not in {args.name}.zip')
        if len(hits) > 1:
            raise Fail(f'member {pat} matches {len(hits)} paths: ' + ', '.join(h['name'] for h in hits))
        wanted.extend(hits)
    names = [os.path.basename(e['name']) for e in wanted]
    if len(set(names)) != len(names):
        raise Fail(f'selected members share a basename: {names}')
    outdir = args.out or os.path.join(OUT, args.name)
    os.makedirs(outdir, exist_ok=True)
    for ent in wanted:
        extract(url, ent, outdir)


if __name__ == '__main__':
    try:
        main()
    except Fail as e:
        print(f'FAILED: {e}', file=sys.stderr)
        sys.exit(1)
    except BrokenPipeError:
        os.dup2(os.open(os.devnull, os.O_WRONLY), sys.stdout.fileno())
