"""Download the whole UW Interactive CT Sinus Anatomy site: every atlas slice
(unlabeled + labeled), scout images + slice->scout mapping, and every image on
the normal/abnormal pages with its caption. Polite: sequential, small delay."""
import json, os, re, time, urllib.request
from html import unescape

BASE = 'http://uwmsk.org/sinusanatomy2/'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'incoming', 'uw-sinusanatomy2')  # gitignored
PAGES = ['index.html', 'quiz.html'] + [f'{s}-{k}.html' for s in ('Frontal', 'Maxillary', 'Ethmoid', 'Sphenoid') for k in ('Normal', 'Abnormal')]

def get(rel, binary=True):
    path = os.path.join(OUT, rel)
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return open(path, 'rb').read()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    for attempt in range(4):
        try:
            data = urllib.request.urlopen(BASE + rel, timeout=30).read()
            open(path, 'wb').write(data)
            time.sleep(0.05)
            return data
        except Exception as e:  # noqa: BLE001
            time.sleep(2 ** attempt)
    print('FAILED', rel)
    return b''

manifest = {'atlas': {}, 'pages': {}}
for plane in ('axial', 'coronal', 'sagittal'):
    html = get(f'{plane}/{plane}.html').decode('latin-1')
    scout = re.search(r'<img src="([^"]+)" id="ref_img"', html).group(1)
    get(f'{plane}/{scout}')
    slices = []
    for m in re.finditer(r'showImg\((\d+)\)[^>]*coords="([\d,]+)"', html):
        n = int(m.group(1)); x1, y1, x2, y2 = map(int, m.group(2).split(','))
        name = f'img{n:03d}'
        get(f'{plane}/{name}.jpg'); get(f'{plane}/{name}lab.jpg')
        slices.append({'n': n, 'scout_rect': [x1, y1, x2, y2], 'img': f'{plane}/{name}.jpg', 'lab': f'{plane}/{name}lab.jpg'})
    manifest['atlas'][plane] = {'scout': f'{plane}/{scout}', 'slices': slices}
    print(plane, len(slices), 'slices')

for page in PAGES:
    html = get(page).decode('latin-1')
    items = []
    for m in re.finditer(r'<img[^>]*src="([^"]+)"[^>]*>(.*?)(?=<img|$)', html, re.S):
        src = m.group(1)
        if src.startswith('http') or 'nav' in src.lower(): continue
        get(src)
        caption = re.sub(r'\s+', ' ', unescape(re.sub(r'<[^>]+>', ' ', m.group(2)))).strip()[:1500]
        items.append({'img': src, 'caption': caption})
    manifest['pages'][page] = items
    print(page, len(items), 'images')

json.dump(manifest, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
print('done')
