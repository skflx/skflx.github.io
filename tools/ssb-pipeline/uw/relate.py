"""UW labels -> graph ids -> pairwise spatial relations -> test the graph's
spatial `rel` claims. In-plane comparisons on the same slice only (robust to
unknown pixel spacing); votes aggregated across slices and planes.

Orientation (verified by eye on sample slices; set in ORIENT below):
axial: anterior = image top; coronal/axial: patient midline from midline labels."""
import difflib, json, os, re, sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
REF = os.path.join(REPO, 'ssb/reference/uw-sinusanatomy2')
MARGIN = 6          # px; smaller differences are not evidence
MIN_SLICES = 3
SAME_LEVEL = 20    # px; medial/lateral only between points at about the same height (coronal) or depth (axial)
CROSS_MARGIN = 15  # px; left-vs-right comparisons carry asymmetry noise
AGREE = 0.8

ORIENT = json.load(open(os.path.join(HERE, 'orient.json')))  # {"sagittal_anterior": "left"|"right"}

labels = json.load(open(os.path.join(REF, 'slices.json')))
vocab_rows = json.load(open(os.path.join(REF, 'labels.json')))
cross = {c['term'].lower(): c for c in json.load(open(os.path.join(REF, 'crosswalk.json')))}
extra = json.load(open(os.path.join(HERE, 'vocab-extra.json'))) if os.path.exists(os.path.join(HERE, 'vocab-extra.json')) else {}

def norm(t):
    t = t.lower().replace('’', "'")
    t = re.sub(r'[^a-z0-9 ]+', ' ', t)
    return re.sub(r'\s+', ' ', t).strip()

vocab = sorted({norm(r['term']) for r in vocab_rows} | {norm(k) for k in extra})
term_ids = {}
for k, c in cross.items():
    if c['match'] in ('exact', 'synonym') and c.get('ids'):
        term_ids[norm(k)] = c['ids']
for k, ids in extra.items():
    term_ids[norm(k)] = ids

MIDLINE_TERMS = {'nasal septum', 'crista galli', 'vomer', 'sella', 'dorsum sella', 'dorsum sellae', 'clivus',
                 'ethmoid bone vertical plate', 'perpendicular plate', 'sphenoid rostrum', 'basion', 'nasion'}

unmatched = []
# OCR variants decoded by eye from label crops (see README): regex on normalized text -> term
ALIASES = [
    (r'^f\w*rta\w*\s*[sb5o]\w*es$|^frontal bones?$', 'frontal bone'),
    (r'^[hjf]?i?[gc]i[gc]$', 'orbit'),
    (r'odontoid|^o\w*s?ntor?d$|^p\w?o?tucpo$', 'odontoid'),
    (r'^1\s*tng$|^c1 ring$', 'c1 ring'),
    (r'^[tm]?n?fer\w*\s*t\w*s\w*rate$|^inferc u5irate$|^infetctursirate$', 'inferior turbinate'),
    (r'^rd\w*t\w*b?nate$|^rd\w*turbnate$', 'middle turbinate'),
    (r'^[rt]d\w*[mr]eatus$', 'middle meatus'),
    (r'^condye$', 'mandibular condyle'),
    (r'^coron\w*d$', 'coronoid process'),
    (r'^arte\w*\s*[io]?\w*\s*etrmoid\s*si\w*\s*\w*$|^arte\w*ioretrmoid', 'anterior ethmoid sinus'),
    (r'^i\w*raorb\w*\s*nerve$', 'infraorbital nerve'),
    (r'^sohenc?petrosal', 'sphenopetrosal synchondrosis'),
    (r'^cordyla\w*\s*fossa$', 'mandibular fossa'),
    (r'^te\w*poral\s*[bpo]one$', 'temporal bone'),
    (r'^infer\w*\s*c?\s*c?\s*bta\w*\s*fora\w*$|^inferocbtaforamer$|^inferorcbtaforarer$', 'inferior orbital foramen'),
    (r'^n?fer\w*bta\w*\s*fssu', 'inferior orbital fissure'),
    (r'^[tf]oram?\w*\s*acerum$', 'foramen lacerum'),
    (r'^cas\s*ccciout$|^basoeciout$', 'basiocciput'),
    (r'^eme$', 'vomer'),
    (r'^nasor\s*axi\s*ary suture$', 'nasomaxillary suture'),
    (r'^alvec?la\s*tcge$', 'alveolar ridge'),
    (r'^c?i?bforr\s*d?ate$', 'cribriform plate'),
    (r'^f\s*atus\s*semiu', 'hiatus semilunaris'),
    (r'^oobc\s*cana$', 'optic canal'),
    (r'^sem\s*circ', 'semicircular canals'),
    (r'^sasa\s*amela', 'basal lamella middle turbinate'),
    (r'^soneroicsnus ostiu', 'sphenoid sinus ostium'),
]

def canon(text, conf):
    n = norm(text)
    if not n:
        return None
    for pat, term in ALIASES:
        if re.search(pat, n) or re.search(pat, n.replace(' ', '')):
            return term
    if n in term_ids or n in vocab:
        return n
    hit = difflib.get_close_matches(n, vocab, n=1, cutoff=0.72)
    return hit[0] if hit else None

votes = defaultdict(lambda: [0, 0])   # (a, b, axis) -> [a_less, a_more]
support = defaultdict(set)
term_count = defaultdict(int)
for plane, rows in labels.items():
    for row in rows:
        pts = []
        for t in row['labels']:
            c = canon(t['text'], t['conf'])
            if not c:
                unmatched.append({'plane': plane, 'n': row['n'], 'text': t['text'], 'conf': t['conf'], 'box': t['box']})
                continue
            term_count[c] += 1
            for tip in t['tips']:
                pts.append((c, tip))
        if not pts:
            continue
        mids = [tip[0] for c, tip in pts if c in MIDLINE_TERMS]
        xmid = sum(mids) / len(mids) if mids else (row['fov_center'][0] if row['fov_center'] else None)
        for i, (a, pa) in enumerate(pts):
            for b, pb in pts[i + 1:]:
                if a == b:
                    continue
                axes = []
                if (plane in ('axial', 'coronal') and xmid is not None and a not in MIDLINE_TERMS and b not in MIDLINE_TERMS
                        and abs(pa[1] - pb[1]) <= SAME_LEVEL):
                    cross_side = (pa[0] - xmid) * (pb[0] - xmid) < 0
                    axes.append(('MLx' if cross_side else 'ML', abs(pa[0] - xmid), abs(pb[0] - xmid)))
                if plane in ('coronal', 'sagittal'):
                    axes.append(('SI', pa[1], pb[1]))          # smaller y = superior
                if plane == 'axial':
                    axes.append(('AP', pa[1], pb[1]))          # smaller y = anterior
                if plane == 'sagittal':
                    sx = 1 if ORIENT['sagittal_anterior'] == 'left' else -1
                    axes.append(('AP', sx * pa[0], sx * pb[0]))
                for axis, va, vb in axes:
                    if abs(va - vb) < (CROSS_MARGIN if axis == 'MLx' else MARGIN):
                        continue
                    axis = 'ML' if axis == 'MLx' else axis
                    key = (a, b, axis) if a < b else (b, a, axis)
                    less = (va < vb) if a < b else (vb < va)
                    votes[key][0 if less else 1] += 1
                    support[key].add(f'{plane}:{row["n"]}')

# consensus relations between UW terms: key (a,b,axis) with a<b; "less" means
# a is more medial (ML) / superior (SI) / anterior (AP) than b
REL = {'ML': ('medial-to', 'lateral-to'), 'SI': ('superior-to', 'inferior-to'), 'AP': ('anterior-to', 'posterior-to')}
consensus = {}
for key, (l, m) in votes.items():
    tot = l + m
    if len(support[key]) < MIN_SLICES:
        continue
    frac = max(l, m) / tot
    if frac < AGREE:
        continue
    a, b, axis = key
    consensus[key] = {'rel': REL[axis][0] if l > m else REL[axis][1], 'votes': [l, m], 'slices': len(support[key])}

# test the graph's spatial claims
INV = {'medial-to': 'lateral-to', 'lateral-to': 'medial-to', 'superior-to': 'inferior-to', 'inferior-to': 'superior-to',
       'anterior-to': 'posterior-to', 'posterior-to': 'anterior-to'}
AXIS = {'medial-to': 'ML', 'lateral-to': 'ML', 'superior-to': 'SI', 'inferior-to': 'SI', 'anterior-to': 'AP', 'posterior-to': 'AP'}
id_terms = defaultdict(set)
for term, ids in term_ids.items():
    for i in ids:
        id_terms[i].add(term)

results = []
for f in sorted(os.listdir(os.path.join(REPO, 'ssb/content'))):
    doc = json.load(open(os.path.join(REPO, 'ssb/content', f)))
    for e in doc.get('structures', []):
        for r in e.get('rel', []) or []:
            if r.get('r') not in AXIS:
                continue
            ta, tb = id_terms.get(e['id'], set()), id_terms.get(r['to'], set())
            verdicts = []
            for a in ta:
                for b in tb:
                    if a == b:
                        continue
                    key = (a, b, AXIS[r['r']]) if a < b else (b, a, AXIS[r['r']])
                    c = consensus.get(key)
                    if not c:
                        continue
                    uw_rel = c['rel'] if a < b else INV[c['rel']]
                    verdicts.append({'terms': [a, b], 'uw': uw_rel, 'votes': c['votes'], 'slices': c['slices'],
                                     'agree': uw_rel == r['r']})
            status = 'untested' if not verdicts else ('agree' if all(v['agree'] for v in verdicts) else
                                                      'contradict' if not any(v['agree'] for v in verdicts) else 'mixed')
            results.append({'id': e['id'], 'r': r['r'], 'to': r['to'], 'note': r.get('note'), 'file': f,
                            'status': status, 'evidence': verdicts})

counts = defaultdict(int)
for x in results:
    counts[x['status']] += 1
out = {
    'params': {'margin_px': MARGIN, 'min_slices': MIN_SLICES, 'agree_frac': AGREE},
    'term_counts': dict(sorted(term_count.items(), key=lambda kv: -kv[1])),
    'consensus': [{'a': k[0], 'b': k[1], 'axis': k[2], **v} for k, v in sorted(consensus.items())],
    'graph_tests': results,
    'unmatched': unmatched,
}
json.dump(out, open(os.path.join(REF, 'relations.json'), 'w'), indent=1)
print('graph spatial claims:', dict(counts), '| consensus pairs:', len(consensus), '| unmatched labels:', len(unmatched),
      '| terms seen:', len(term_count))
