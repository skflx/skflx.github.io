"""Download only the needed members of one OpenEar archive (Zenodo record 1473724, CC BY 4.0).

OpenEar ships one multi-GB zip per temporal bone (ZETA.zip, ALPHA.zip, ...). RangeFile is a read-only
file object over HTTP Range requests, so Python's zipfile reads the central directory (ZIP64 included)
without downloading the archive whole; then only the members asked for (default: CBCT_Unembedded.nrrd
and Segmentation.seg.nrrd) are streamed, one request at a time. zipfile CRC32-checks each member at
end of stream; sizes are checked before rename.

Output: tools/tbone-pipeline/incoming/openear/<NAME>/<basename> (git-ignored; never committed)
  python3 tools/tbone-pipeline/fetch_openear.py ZETA --list
  python3 tools/tbone-pipeline/fetch_openear.py ZETA
"""
import argparse, io, os, re, sys, time, urllib.error, urllib.request, zipfile

RECORD = '1473724'
BASE = f'https://zenodo.org/records/{RECORD}/files/'
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'incoming', 'openear')
DEFAULT_MEMBERS = ('CBCT_Unembedded.nrrd', 'Segmentation.seg.nrrd')
UA = 'tbone-pipeline-fetch/1'
BACKOFF = (2, 4, 8, 16)
RETRY_STATUS = (429, 500, 502, 503, 504)
CHUNK = 8 << 20          # read-ahead per Range request
PROGRESS = 32 << 20      # progress line every this many bytes


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


class RangeFile(io.RawIOBase):
    """Read-only, seekable file over one URL. Each readinto() is one Range request."""

    def __init__(self, url):
        self.url = url
        _, headers = fetch(url, 0, 0)
        cr = headers.get('Content-Range', '')
        if '/' not in cr:
            raise Fail(f'no Content-Range in probe response: {dict(headers)}')
        self.size = int(cr.rsplit('/', 1)[1])
        self.pos = 0

    def readable(self):
        return True

    def seekable(self):
        return True

    def seek(self, offset, whence=io.SEEK_SET):
        base = {io.SEEK_SET: 0, io.SEEK_CUR: self.pos, io.SEEK_END: self.size}[whence]
        if base + offset < 0:
            raise OSError('negative seek position')
        self.pos = base + offset
        return self.pos

    def tell(self):
        return self.pos

    def readinto(self, b):
        n = min(len(b), self.size - self.pos)
        if n <= 0:
            return 0
        data, _ = fetch(self.url, self.pos, self.pos + n - 1)
        b[:n] = data
        self.pos += n
        return n


def extract(zf, info, outdir):
    name = os.path.basename(info.filename)
    if name in ('', '.', '..'):
        raise Fail('unsafe member name')
    dest = os.path.join(outdir, name)
    if os.path.exists(dest) and os.path.getsize(dest) == info.file_size:
        print(f'skip {name}: already present ({info.file_size} bytes)')
        return dest
    if info.compress_type not in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED):
        raise Fail(f'{info.filename}: compression method {info.compress_type} not supported')
    part = dest + '.part'
    written = 0
    next_mark = PROGRESS
    t0 = time.time()
    print(f'{name}: {info.file_size} bytes ({info.compress_size} compressed)')
    try:
        with zf.open(info) as src, open(part, 'wb') as f:
            while True:
                chunk = src.read(1 << 20)
                if not chunk:
                    break
                f.write(chunk)
                written += len(chunk)
                if written >= next_mark:
                    print(f'  {written:>13} / {info.file_size}  ({time.time() - t0:.0f} s)')
                    next_mark += PROGRESS
    except zipfile.BadZipFile as e:
        if os.path.exists(part):
            os.remove(part)
        raise Fail(f'{info.filename}: {e}')
    if written != info.file_size:
        os.remove(part)
        raise Fail(f'{name}: size {written}, expected {info.file_size}')
    os.replace(part, dest)
    print(f'  wrote {dest} ({written} bytes, CRC32 {info.CRC:08x} verified)')
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
    raw = RangeFile(url)
    with io.BufferedReader(raw, buffer_size=CHUNK) as fp, zipfile.ZipFile(fp) as zf:
        entries = zf.infolist()
        if args.list:
            for e in entries:
                print(f'{e.file_size:>13} {e.compress_size:>13} {e.compress_type:>3}  {e.filename}')
            print(f'{len(entries)} members; archive {raw.size} bytes')
            return
        wanted = []
        for pat in args.members:
            hits = [e for e in entries if not e.filename.endswith('/')
                    and (e.filename == pat or e.filename.endswith('/' + pat))]
            if not hits:
                raise Fail(f'member {pat} is not in {args.name}.zip')
            if len(hits) > 1:
                raise Fail(f'member {pat} matches {len(hits)} paths: ' + ', '.join(h.filename for h in hits))
            wanted.extend(hits)
        names = [os.path.basename(e.filename) for e in wanted]
        if len(set(names)) != len(names):
            raise Fail(f'selected members share a basename: {names}')
        outdir = args.out or os.path.join(OUT, args.name)
        os.makedirs(outdir, exist_ok=True)
        for info in wanted:
            extract(zf, info, outdir)


if __name__ == '__main__':
    try:
        main()
    except (Fail, zipfile.BadZipFile) as e:
        print(f'FAILED: {e}', file=sys.stderr)
        sys.exit(1)
    except BrokenPipeError:
        os.dup2(os.open(os.devnull, os.O_WRONLY), sys.stdout.fileno())
