"""Download the UW Interactive Temporal Bone Atlas, normal anatomy, all four planes:
every slice (unlabeled imgNN.jpg + labeled imgNNlab.jpg), the scout image and the
slice->scout map (the <plane>.html image-map `coords`). Polite: sequential, small delay.
Resumable: files already present are kept, so a seeded incoming/ is not re-fetched.

Output: tools/tbone-pipeline/incoming/uw-temporalbone/ (ignored by version control; never committed)
  <plane>/<plane>.html, <plane>/<scout>.jpg, <plane>/imgNN.jpg, imgNNlab.jpg ; manifest.json
"""
import json, os, re, time, urllib.request

BASE = 'http://uwmsk.org/temporalbone/images/normal/'
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'incoming', 'uw-temporalbone')
PLANES = ('axial', 'coronal', 'parallel', 'perpendicular')


def get(rel):
    path = os.path.join(OUT, rel)
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return open(path, 'rb').read()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    for attempt in range(4):
        try:
            data = urllib.request.urlopen(BASE + rel, timeout=30).read()
            open(path, 'wb').write(data)
            time.sleep(0.1)
            return data
        except Exception:  # noqa: BLE001
            time.sleep(2 ** attempt)
    print('FAILED', rel)
    return b''


def main():
    manifest = {}
    for plane in PLANES:
        html = get(f'{plane}/{plane}.html').decode('latin-1')
        scout = re.search(r'<img src="([^"]+)"[^>]*id="ref_img"', html).group(1)
        get(f'{plane}/{scout}')
        slices = []
        for m in re.finditer(r'showImgLab\((\d+)\)[^>]*coords="([\d,]+)"', html):
            n = int(m.group(1)); x1, y1, x2, y2 = map(int, m.group(2).split(','))
            get(f'{plane}/img{n:02d}.jpg'); get(f'{plane}/img{n:02d}lab.jpg')
            slices.append({'n': n, 'scout_rect': [x1, y1, x2, y2]})
        manifest[plane] = {'scout': f'{plane}/{scout}', 'slices': slices}
        print(plane, len(slices), 'slices (unlabeled + labeled), scout', scout)
    json.dump(manifest, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
