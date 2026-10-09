"""UW teaching-page figures -> ssb/reference/uw-sinusanatomy2/figures.json (WP FG1,
docs/realistic-anatomy.md §10; sources §4.1, limits §5). Numbers and text only: no pixel is stored.

    python3 -I figures.py build              # incoming/ pages + images -> figures.json (fetches what is missing)
    python3 -I figures.py overlay ID [ID..]  # check PNG (mask, labels, tips) -> --out DIR (default: system temp)
    python3 -I figures.py sheet [--out DIR]  # contact sheets of every traced figure's overlay

Needs the venv of tools/ssb-pipeline/README.md (numpy, pillow, scipy, scikit-image, rapidocr).

Per figure: page(s), file, size, plane (caption, cross-checked against the file name), window
(bone | soft) and contrast (caption "post-contrast"), caption(s), the caption's abbreviation map,
labels read from the image, arrows (tail -> tip px), point marks (arrowheads, asterisks), graph ids,
role N/V/P and candidate same-patient group. Ids, roles and groups are transcribed from §4.1 (TABLE
below) and never inferred; an id the graph lacks, or that §4.1 marks uncertain, is carried as a
proposal with its reason, and `ids` stays null. Opus fills what is null at the checkpoint.

Annotation mask. The atlas JPEGs are resampled copies: a white stroke's core sits at 240-255 and its
anti-aliased edge at 160-230, so "pixels >= 250 in thin components" alone fragments strokes and
glyphs. The mask is therefore: SEED = pixels >= HI that are not in a thick bright region (opening of
>= HI by a disk of THICK_R, dilated 1 px), grown to pixels >= LO within REACH px of a seed, minus the
thick region. Saturated tissue (soft-tissue and post-contrast windows clip bone at 255) makes the
mask unusable there (docs/realistic-anatomy.md §10, FG1 ruling): those figures are recorded in full
with `arrows: null` and the reason below; tips are traced on the bone-window figures only. Each
traced figure carries a `maskCheck` (components that were not text, arrow or mark, and whether the
caption's own arrow/arrowhead/asterisk words found a match).

Arrow geometry. A shaft is a straight skeleton; its two most distant ends are tail and head. The tail
is the end beside a label (<= 40 px; as extract.py), else the end with less mass; the tip is the
component pixel farthest from the tail (the apex of the head). `tipBy` records which rule decided.
Arrowheads with no shaft and asterisks are point marks (`approx`: centroid / OCR-box position).
Asterisks are found through OCR only. Left-right is not asserted (no label names a side)."""
import difflib, glob, html, json, os, re, sys, tempfile, urllib.parse, urllib.request
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from skimage.measure import label as cc_label, regionprops
from skimage.morphology import disk, opening, skeletonize

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
RAW = os.path.join(HERE, '..', 'incoming', 'uw-sinusanatomy2')  # gitignored; never committed
REF = os.path.join(REPO, 'ssb', 'reference', 'uw-sinusanatomy2')
OUT = os.path.join(REF, 'figures.json')
BASE = 'http://uwmsk.org/sinusanatomy2/'
PAGES = [f'{s}-{k}.html' for s in ('Frontal', 'Maxillary', 'Ethmoid', 'Sphenoid') for k in ('Normal', 'Abnormal')]

HI, LO, REACH, THICK_R, THICK_MIN, BIG_COMP = 240, 200, 3, 5, 700, 1500
SATURATED_PCT = 4.0   # thick-bright area (% of image) at or above which the window clips the annotation value
NOT_SEPARABLE = 'annotation not separable by threshold (saturated window)'
TAIL_LABEL_PX = 40
OCR_SCALES = (2, 3, 4)
HEAD_RATIO = 2.5      # arrow head width / shaft width; cortex ribbons (also >= 250) stay near 1-1.8
MAX_ARROW_PX = 170
SUSPECT_RING = 0.10   # share of bright (bone) pixels in the ring round an arrow; above it the arrow may be a cortex line
RING_P25 = 140        # annotation sits beside darker tissue or air; cortex specks sit inside bright bone

# ---- §4.1, transcribed. ids: graph ids the table gives with confidence; cand: ids it marks uncertain ("?" or "or");
# new: ids/ideas it marks (new); mimic: "mimic of"; note: its remark. role: N/V/P; groups: see GROUPS.
def T(ids=(), role=None, cand=(), new=(), mimic=(), note=None, why=None):
    return dict(ids=list(ids), role=role, cand=list(cand), new=list(new), mimic=list(mimic), note=note, why=why)
PI = 'c.sinonasal-inflammatory-patterns'
TABLE = {
    'Axial.frontalsinus1': T(['s.frontal-sinus'], 'N'),
    'Cor.frontalsinus1': T(['s.frontal-sinus', 's.nasal-septum'], 'N'),
    'Sag.FSDP2': T(['lm.frontal-ostium', 's.frontal-recess', 's.agger-nasi-cell'], 'N'),
    'Sag.FSDP5': T(['pw.frontal-drainage', 's.hiatus-semilunaris'], 'N'),
    'Cor.FSDP6': T(['s.frontal-recess'], 'N'),
    'Cor.FSDP1': T(['s.frontal-recess', 's.hiatus-semilunaris', 's.ethmoid-bulla'], 'N'),
    'Cor.VariantFSDP1': T(['v.uncinate-insertion-skull-base', 'pw.frontal-drainage-infundibular'], 'V'),
    'Cor.VariantFSDP2': T(['v.uncinate-insertion-lamina-papyracea'], 'V'),
    'Axial.FShypo': T(role='V', new=['v.frontal-sinus-hypoplasia'], why='§4.1: the graph has frontal aplasia only; hypoplasia is a new id'),
    'Cor.PneumFS': T(role='V', new=['extensive frontal pneumatization', 'bulla hyperpneumatization'], why='§4.1: both are new ids (no id string given)'),
    'Cor.pneumCG': T(['v.crista-galli-pneumatization'], 'V', note='incidental left ZMC fracture: exclude'),
    'Cor.frontalinflamm3': T([PI], 'P', note='pattern: sporadic'),
    'Cor.frontalinflamm2': T([PI], 'P', note='pattern: OMU'),
    'Cor.OMU4': T([PI, 'v.maxillary-sinus-hypoplasia'], 'PV', note='pattern: OMU; right maxillary hypoplasia'),
    'Sag.anteriorOMU': T([PI], 'P', note='pattern: anterior OMU'),
    'Sag.FSDP': T([PI], 'P', note='patterns: OMU + SER'),
    'axial.MRCfrontal2': T(['dz.mucus-retention-cyst'], 'P'),
    'Cor.MRCfrontal1': T(['dz.mucus-retention-cyst'], 'P'),
    'Cor.frontalmucocele': T(['dz.mucocele'], 'P'),
    'Sag.frontalmucocele': T(['dz.mucocele'], 'P'),
    'axial.frontalmucocele': T(['dz.mucocele'], 'P'),
    'Epidabscess1': T(['dz.epidural-abscess'], 'P'),
    'Epidabscess3': T(['dz.epidural-abscess'], 'P', cand=['dz.subperiosteal-orbital-abscess'],
                      note='another patient than Epidabscess1 (caption)', why='§4.1 marks dz.subperiosteal-orbital-abscess with "?"'),
    'Osteoma2': T(['dz.osteoma'], 'P'), 'Osteoma3': T(['dz.osteoma'], 'P'), 'Osteoma4': T(['dz.osteoma'], 'P'),
    'Axial.max.1': T(['s.maxillary-sinus', 's.nasolacrimal-duct'], 'N'),
    'Cor.OMU2': T(['s.ethmoid-infundibulum', 's.hiatus-semilunaris'], 'N',
                  note='§4.1: not a clean normal: Maxillary-Abnormal captions the same image with anterior ethmoid disease, a right MRC and a right paradoxical MT'),
    'Sag.max2': T(['s.uncinate-process', 's.ethmoid-bulla'], 'N'),
    'Axial.Maxhypo': T(['v.maxillary-sinus-hypoplasia'], 'VP', cand=['dz.cocaine-midline-destructive-lesion', 'dz.gpa'],
                       new=['dz.septal-perforation'], note='absent septum: §4.1 gives a new dz.septal-perforation or the existing causes (candidates)'),
    'Axial.PneumMT': T(['v.concha-bullosa'], 'V'), 'Cor.pneumMT': T(['v.concha-bullosa'], 'V'),
    'Paradox.MT.curve': T(['v.paradoxical-middle-turbinate'], 'V'),
    'Cor.SeptDeviatnSpur': T(['v.septal-deviation', 'v.septal-spur'], 'V'),
    'Cor.Maxseptum': T(['v.maxillary-sinus-septa'], 'V'),
    'Axial.Maxillarysinus': T(['dz.acute-rhinosinusitis'], 'P'),
    'Cor.OMU5': T([PI], 'P', note='patterns: infundibular + OMU'),
    'Cor.Inflamm2': T([PI], 'P', note='pattern: infundibular'),
    'Axial.acutesinus1': T(['dz.acute-rhinosinusitis'], 'P'), 'Axial.acutesinus2': T(['dz.acute-rhinosinusitis'], 'P'),
    'Cor.foamysinus': T(['dz.acute-rhinosinusitis'], 'P'),
    'Aggressivesinus3': T(['dz.acute-rhinosinusitis'], 'P', mimic=['dz.acute-invasive-fungal-sinusitis']),
    'Aggressivesinus1': T(['s.retroantral-fat-pad'], 'P', note='§4.1: red flag for AIFS (dz.acute-invasive-fungal-sinusitis)'),
    'Cor.MRCmax1': T(['dz.mucus-retention-cyst'], 'P', mimic=['dz.mucocele']),
    'Sag.MRCmax3': T(['dz.mucus-retention-cyst'], 'P', mimic=['dz.mucocele']),
    'Cor.Maxpolyp': T(role='P', cand=['dz.crs-with-polyps'], mimic=['dz.mucus-retention-cyst'], why='§4.1 marks dz.crs-with-polyps with "?"'),
    'AntrochoanalPolyp1': T(['dz.antrochoanal-polyp'], 'P'),
    'Axial.ethmoid1': T(['s.crista-galli', 's.anterior-clinoid-process', 's.optic-canal'], 'N', note='§4.1 also names the ethmoidal arteries (no id given); canal QA'),
    'Axial.ethmoid2': T(['s.basal-lamella', 's.lamina-papyracea'], 'N', note='basal lamella QA'),
    'Sag.ethmoidnormal': T(['s.sphenoethmoidal-recess'], 'N'),
    'Cor.basallamella': T(['s.basal-lamella', 's.cribriform-plate', 's.fovea-ethmoidalis'], 'N'),
    'Sag.basallamella2': T(['s.basal-lamella'], 'N'),
    'Axial.Aggernasicell': T(['s.agger-nasi-cell'], 'N'), 'Cor.Aggernasicell': T(['s.agger-nasi-cell'], 'N'),
    'Sag.Aggernasicell': T(['s.agger-nasi-cell'], 'N'),
    'Cor.ethmoidbulla1': T(['s.ethmoid-bulla', 's.uncinate-process'], 'N'),
    'Cor.ethmoidbulla3': T(role='V', new=['bulla hyperpneumatization'], why='§4.1: a new id (no id string given)'),
    'Axial.hallercell1': T(['v.infraorbital-ethmoid-cell'], 'V'), 'Cor.Hallercell1': T(['v.infraorbital-ethmoid-cell'], 'V'),
    'Sag.hallercell': T(['v.infraorbital-ethmoid-cell'], 'V'),
    'Axial.antethmoidinf': T([PI], 'P', note='pattern: OMU'),
    'Sag.ethmoidinflamm3': T([PI], 'P', note='pattern: SER'),
    'Axial.ethmoidinflamm4': T(role='P', why='§4.1 gives no id ("—")'),
    'Cor.ethmoidinfunddz1': T([PI, 'v.uncinate-insertion-skull-base'], 'PV', note='pattern: infundibular'),
    'Sag.OMU&Sps': T(why='not in the §4.1 table (the table has no row for this file)'),
    'Mucocele1': T(['dz.mucocele'], 'P'),
    'Orbitalcellulitis2': T(['dz.orbital-cellulitis', 'c.chandler'], 'P'),
    'Axial.CSthrombosis': T(['dz.cavernous-sinus-thrombosis'], 'P'), 'Sag.CSthrombosis': T(['dz.cavernous-sinus-thrombosis'], 'P'),
    'Cor.CSthrombosis': T(['dz.cavernous-sinus-thrombosis'], 'P'),
    'Axial.ethmoidosteoma1': T(['dz.osteoma'], 'P'), 'Cor.ethmoidosteoma2': T(['dz.osteoma'], 'P'),
    'Axial.sphenoid1': T(['s.sphenoid-sinus', 's.sphenoethmoidal-recess'], 'N', note='§4.1 also names the carotid canal (no id given)'),
    'Cor.sphenoid1': T(['s.foramen-rotundum', 's.vidian-canal', 's.optic-canal'], 'N', note='canal QA'),
    'Sag.sphenoid': T(['lm.sphenoid-ostium', 's.sphenoethmoidal-recess'], 'N'),
    'Axial.Pneumsphenoid1': T(['v.lateral-recess-pneumatization'], 'V', note='FS in this caption is foramen spinosum, not frontal sinus'),
    'Cor.Pneumsphenoid1': T(['v.lateral-recess-pneumatization', 'v.v2-protrusion-sphenoid'], 'V'),
    'Axial.BilatOnodicells1': T(['v.sphenoethmoidal-cell'], 'V'),
    'Cor.Onodicell3': T(['v.sphenoethmoidal-cell', 'v.pneumatized-anterior-clinoid'], 'V'),
    'axial.pneum.ptyp': T(role='V', new=['v.pterygoid-pneumatization'], why='§4.1: v.pterygoid-pneumatization is a new id (gaps.md proposed a synonym; it is a distinct extension)'),
    'Axial.sphenoidhypo': T(role='V', cand=['v.conchal-sphenoid', 'v.presellar-sphenoid'], why='§4.1: Opus judges which of the two'),
    'Sphenoidsinus1': T([PI], 'P', note='pattern: SER'), 'Sphenoidsinus2': T([PI], 'P', note='pattern: SER'),
    'Sphenoidsinus3': T([PI], 'P', note='pattern: SER'),
    'Mucocele3': T(['dz.mucocele'], 'P'), 'Mucocele5': T(['dz.mucocele'], 'P'),
    'Axial.SphenoidCSthrombosis': T(['dz.cavernous-sinus-thrombosis'], 'P'), 'Cor.SphenoidCSthrombosis': T(['dz.cavernous-sinus-thrombosis'], 'P'),
}
# Candidate same-patient sets (§4.1 "⧉"; "⧉?" = the table itself doubts it). Opus confirms by anatomy (§5 item 4).
GROUPS = {
    'aggernasicell': (['Axial.Aggernasicell', 'Cor.Aggernasicell', 'Sag.Aggernasicell'], 'table ⧉'),
    'hallercell': (['Axial.hallercell1', 'Cor.Hallercell1', 'Sag.hallercell'], 'table ⧉'),
    'frontalmucocele': (['Cor.frontalmucocele', 'Sag.frontalmucocele', 'axial.frontalmucocele'], 'table ⧉'),
    'frontalosteoma': (['Osteoma2', 'Osteoma3', 'Osteoma4'], 'table ⧉'),
    'csthrombosis-ethmoid': (['Axial.CSthrombosis', 'Sag.CSthrombosis', 'Cor.CSthrombosis'], 'table ⧉'),
    'csthrombosis-sphenoid': (['Axial.SphenoidCSthrombosis', 'Cor.SphenoidCSthrombosis'], 'table ⧉'),
    'sphenoid-mucocele': (['Mucocele3', 'Mucocele5'], 'table ⧉'),
    'maxillary-mrc': (['Cor.MRCmax1', 'Sag.MRCmax3'], 'table ⧉?'),
    'ethmoid-osteoma': (['Axial.ethmoidosteoma1', 'Cor.ethmoidosteoma2'], 'table ⧉?'),
    'sphenoid-sinusitis': (['Sphenoidsinus1', 'Sphenoidsinus2', 'Sphenoidsinus3'], 'table ⧉?'),
}
# Window. Caption words decide first ("soft tissue window", "post-contrast"); then §4.1's soft marker; then the
# histogram (thick-bright area >= SATURATED_PCT). A figure the histogram flags but that is a bone window on sight is
# listed in BONE_SATURATED with the reason.
TABLE_SOFT = {'AntrochoanalPolyp1', 'Sag.frontalmucocele', 'axial.frontalmucocele', 'Mucocele5', 'Mucocele3'}
BONE_SATURATED = {'Cor.Inflamm2': 'viewed: bone window; wide cortical saturation of the maxillary and facial bone, soft tissue stays dark'}
PLANE_WORDS = [('axial', 'axial'), ('coronal', 'coronal'), ('coronl', 'coronal'), ('sagittal', 'sagittal'), ('sagitttal', 'sagittal')]
FILE_PLANE = [('axial', 'axial'), ('cor', 'coronal'), ('sag', 'sagittal')]

def unesc(s):
    return html.unescape(s)

# ---------------------------------------------------------------- page parse
def get(rel):
    path = os.path.join(RAW, rel)
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return path
    os.makedirs(os.path.dirname(path), exist_ok=True)
    url = BASE + urllib.parse.quote(rel, safe='/')  # '&' in a file name must be percent-encoded
    open(path, 'wb').write(urllib.request.urlopen(url, timeout=30).read())
    return path

def parse_pages():
    figs, order = {}, []
    for page in PAGES:
        h = open(get(page), 'rb').read().decode('utf-8', 'replace')
        for m in re.finditer(r'<img[^>]*src="(images/[^"]+)"[^>]*>(.*?)(?=<img|</table>|$)', h, re.S):
            src = unesc(m.group(1))  # HTML entities in src (Sag.OMU&amp;Sps.jpg)
            cap = re.sub(r'\s+', ' ', unesc(re.sub(r'<[^>]+>', ' ', m.group(2)))).strip()
            fid = os.path.basename(src)[:-4]
            if fid not in figs:
                figs[fid] = {'file': src, 'pages': []}
                order.append(fid)
            figs[fid]['pages'].append({'page': page, 'caption': cap})
    return figs, order

def abbreviations(caption):
    out = {}
    for par in re.findall(r'\(([^()]*:[^()]*)\)', caption):
        for part in par.split(','):
            m = re.match(r'^\s*([A-Za-z*]{1,5}):\s*(.+?)\s*$', part)
            if m:
                out[m.group(1)] = m.group(2)
    return out

def plane_of(fid, caption):
    cap = caption.lower().split(' ')[0]
    by_caption = next((v for k, v in PLANE_WORDS if cap.startswith(k)), None)
    by_file = next((v for k, v in FILE_PLANE if fid.lower().startswith(k)), None)
    return by_caption, by_file

# ---------------------------------------------------------------- vocabulary
def norm(t):
    t = re.sub(r'[^a-z0-9 ]+', ' ', t.lower().replace('’', "'"))
    return re.sub(r'\s+', ' ', t).strip()

def load_terms():
    term_ids = {}
    for c in json.load(open(os.path.join(REF, 'crosswalk.json'))):
        if c['match'] in ('exact', 'synonym') and c.get('ids'):
            term_ids[norm(c['term'])] = c['ids']
    extra = os.path.join(HERE, 'vocab-extra.json')
    if os.path.exists(extra):
        for k, ids in json.load(open(extra)).items():
            term_ids[norm(k)] = ids
    return term_ids

def graph_ids():
    ids = set()
    for f in glob.glob(os.path.join(REPO, 'ssb', 'content', '*.json')):
        if f.endswith('sources.json'):
            continue
        for v in json.load(open(f)).values():
            if isinstance(v, list):
                ids.update(e['id'] for e in v if isinstance(e, dict) and 'id' in e)
    return ids

# ---------------------------------------------------------------- image analysis
def gray(fid):
    return np.asarray(Image.open(get('images/' + fid + '.jpg')).convert('L'))  # fetches a missing image

def thick_region(g):
    m = g >= HI
    thick = opening(m, disk(THICK_R))  # wider than any arrow shaft or glyph stroke; a big solid arrowhead leaves < THICK_MIN
    lab, n = ndi.label(thick)
    if n:
        sizes = ndi.sum(thick, lab, range(1, n + 1))
        big = ndi.label(m, structure=np.ones((3, 3)))[0]  # only inside a bright component too large to be an overlay
        big_ids = {i for i, z in enumerate(ndi.sum(m, big, range(1, big.max() + 1)), 1) if z >= BIG_COMP}
        thick = np.isin(lab, [i + 1 for i, z in enumerate(sizes) if z >= THICK_MIN]) & np.isin(big, list(big_ids))
    return m, ndi.binary_dilation(thick, iterations=1), thick

def annotation_mask(g):
    m, thickd, thick = thick_region(g)
    seeds = m & ~thickd
    near = ndi.distance_transform_edt(~seeds) <= REACH
    return near & (g >= LO) & ~thickd, thickd, float(thick.mean() * 100)

_ocr = None
def ocr_boxes(mask, g):
    """OCR the glyph pixels at several scales; per box keep the reading that matches the vocabulary, else the surest."""
    global _ocr
    if _ocr is None:
        from rapidocr_onnxruntime import RapidOCR
        _ocr = RapidOCR()
    keep = ndi.binary_dilation(mask, iterations=2)
    a0 = np.where(keep, g, 0).astype(np.uint8)
    found = []
    for sc in OCR_SCALES:
        a = np.asarray(Image.fromarray(a0).resize((a0.shape[1] * sc, a0.shape[0] * sc), Image.LANCZOS))
        img = np.pad(np.stack([a] * 3, -1), ((30, 30), (30, 30), (0, 0)))
        res, _ = _ocr(img)
        for quad, text, conf in res or []:
            q = (np.array(quad) - 30) / sc
            found.append({'raw': text.strip(), 'conf': round(float(conf), 3),
                          'box': [int(q[:, 0].min()), int(q[:, 1].min()), int(q[:, 0].max()), int(q[:, 1].max())]})
    return found

def iou(a, b):
    ix = max(0, min(a[2], b[2]) - max(a[0], b[0])); iy = max(0, min(a[3], b[3]) - max(a[1], b[1]))
    inter = ix * iy
    u = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter
    return inter / u if u else 0

CONFUSE = str.maketrans({'3': 'S', '5': 'S', '0': 'O', '1': 'I', '|': 'I', '8': 'B', '$': 'S'})

def snap(raw, abbr, site_abbr, terms):
    """-> (text|None, how). Exact against the caption's abbreviations, then after a digit/letter confusion map, then the
    site-wide set only when unique, then (full words) a fuzzy match of the crosswalk terms. Never a guess between ties."""
    r = raw.strip()
    if re.fullmatch(r'[*.\s]+', r):
        return r.replace(' ', ''), 'mark'
    for cand, how in ((r, 'exact'), (r.translate(CONFUSE), 'confusion')):
        up = cand.upper() if len(cand) <= 5 else cand
        for k in abbr:
            if k.upper() == up.upper():
                return k, how + '-caption'
        hits = [k for k in site_abbr if k.upper() == up.upper()]
        if len(hits) == 1 and len(cand) <= 5:
            return hits[0], how + '-site'
    n = norm(r)
    if len(n) > 5:
        if n in terms:
            return r, 'term'
        near = difflib.get_close_matches(n, list(terms), n=2, cutoff=0.8)
        if len(near) == 1 or (len(near) == 2 and difflib.SequenceMatcher(None, n, near[0]).ratio() - difflib.SequenceMatcher(None, n, near[1]).ratio() > 0.05):
            return near[0], 'fuzzy-term'
    return None, 'unread'

def merge_ocr(found, abbr, site_abbr, terms):
    found = [f for f in found if re.search(r'[A-Za-z0-9*]', f['raw']) and f['conf'] >= 0.5
             and f['box'][3] - f['box'][1] <= 36 and f['box'][2] - f['box'][0] <= 260]
    found = sorted(found, key=lambda f: -f['conf'])
    kept = []
    for f in found:
        f['text'], f['how'] = snap(f['raw'], abbr, site_abbr, terms)
        dup = next((k for k in kept if iou(k['box'], f['box']) > 0.3), None)
        if dup is None:
            kept.append(f)
        elif dup['text'] is None and f['text'] is not None:
            kept[kept.index(dup)] = f
    return sorted(kept, key=lambda f: (f['box'][1], f['box'][0]))

def endpoints(skel):
    k = np.ones((3, 3), int); k[1, 1] = 0
    nb = ndi.convolve(skel.astype(int), k, mode='constant')
    ys, xs = np.nonzero(skel & (nb == 1))
    return list(zip(xs.tolist(), ys.tolist()))

def box_dist(b, p):
    dx = max(b[0] - p[0], 0, p[0] - b[2]); dy = max(b[1] - p[1], 0, p[1] - b[3])
    return (dx * dx + dy * dy) ** 0.5

def trace(g, abbr, site_abbr, terms, star_ok=False):
    mask, thickd, thick_pct = annotation_mask(g)
    texts = merge_ocr(ocr_boxes(mask, g), abbr, site_abbr, terms)
    text_px = np.zeros_like(mask)
    for t in texts:
        x0, y0, x1, y1 = t['box']
        text_px[max(0, y0 - 2):y1 + 3, max(0, x0 - 2):x1 + 3] = True
    rest = ndi.binary_closing(mask & ~text_px, iterations=2)  # bridges stroke gaps (a shaft crossing a bright septum)
    comps = cc_label(rest, connectivity=2)
    arrows, heads, stars, specks = [], [], [], 0
    contam = {'noHead': 0, 'curved': 0, 'tooLong': 0, 'shortNotHead': 0, 'onBone': 0}
    boxes = [t['box'] for t in texts if t['text'] and not re.fullmatch(r'[*.]+', t['text'])]
    touch_zone = ndi.binary_dilation(thickd, iterations=2)
    for r in regionprops(comps):
        minr, minc, maxr, maxc = r.bbox
        if r.area < 30:
            specks += 1
            if star_ok and 8 <= r.area <= 29 and max(maxr - minr, maxc - minc) <= 12:
                full = comps == r.label
                ring = ndi.binary_dilation(full, iterations=4) & ~ndi.binary_dilation(full, iterations=1)
                if np.percentile(g[ring], 25) <= RING_P25:
                    cy, cx = r.centroid
                    stars.append({'kind': 'asterisk', 'at': [int(round(cx)), int(round(cy))], 'approx': True, 'by': 'speck (caption names an asterisk)'})
            continue
        comp = comps[minr:maxr, minc:maxc] == r.label
        sk = skeletonize(comp)
        dt = ndi.distance_transform_edt(np.pad(comp, 1))[1:-1, 1:-1]
        ends = [(x + minc, y + minr) for x, y in endpoints(sk)]
        w, h = maxc - minc, maxr - minr
        full = comps == r.label
        ring = ndi.binary_dilation(full, iterations=4) & ~ndi.binary_dilation(full, iterations=1)
        on_bone = np.percentile(g[ring], 25) > RING_P25  # wholly inside bright bone: a cortex speck, not an overlay
        if len(ends) < 2:
            contam['shortNotHead'] += 1
            continue
        py, px = np.unravel_index(np.argmax(dt), dt.shape)
        head_at = (int(px + minc), int(py + minr))  # the widest point: the arrowhead (or the widest cortex)
        # tail: the skeleton end farthest from the head; a label's end wins when it is also well away from the head
        far_end = max(ends, key=lambda e: (e[0] - head_at[0]) ** 2 + (e[1] - head_at[1]) ** 2)
        L = float(np.hypot(far_end[0] - head_at[0], far_end[1] - head_at[1]))
        tail, how = far_end, 'head'
        if boxes:
            lab_end = min(ends, key=lambda e: min(box_dist(bx, e) for bx in boxes))
            if min(box_dist(bx, lab_end) for bx in boxes) <= TAIL_LABEL_PX and np.hypot(lab_end[0] - head_at[0], lab_end[1] - head_at[1]) >= 0.6 * L:
                tail, how = lab_end, 'label'
        if L < 14:  # a head without a shaft: a compact, convex, triangle-filled blob
            fill = r.area / float(w * h)
            if on_bone:
                contam['onBone'] += 1
            elif 40 <= r.area <= 260 and dt.max() >= 2.5 and r.solidity >= 0.75 and max(w, h) <= 26 and 0.3 <= fill <= 0.65:
                cy, cx = r.centroid
                heads.append({'kind': 'arrowhead', 'at': [int(round(cx)), int(round(cy))], 'approx': True})
            else:
                contam['shortNotHead'] += 1
            continue
        if L > MAX_ARROW_PX:
            contam['tooLong'] += 1
            continue
        ys, xs = np.nonzero(sk)
        pts = np.stack([xs + minc, ys + minr], 1).astype(float)
        d = head_at[0] - tail[0], head_at[1] - tail[1]
        dn = float(np.hypot(*d)) or 1.0
        head_r = 1.6 * dt.max() + 4  # the barbs of the head are not the shaft
        away = np.hypot(pts[:, 0] - head_at[0], pts[:, 1] - head_at[1]) > head_r
        dev = np.abs((pts[:, 0] - tail[0]) * d[1] - (pts[:, 1] - tail[1]) * d[0]) / dn
        if away.any() and dev[away].max() > max(4.0, 0.2 * dn):
            contam['curved'] += 1
            continue
        far = ((xs + minc - head_at[0]) ** 2 + (ys + minr - head_at[1]) ** 2) > head_r ** 2
        shaft_w = float(np.median(dt[ys[far], xs[far]])) if far.any() else float(np.median(dt[sk]))
        ratio = float(dt.max() / max(shaft_w, 1.0))
        if ratio < HEAD_RATIO or on_bone and ratio < 2 * HEAD_RATIO:
            contam['noHead'] += 1
            continue
        cpix = np.stack(np.nonzero(comp), 1)[:, ::-1] + [minc, minr]
        tip = cpix[np.argmax(((cpix - np.array(tail)) ** 2).sum(1))]
        if np.hypot(tip[0] - head_at[0], tip[1] - head_at[1]) > 3.2 * dt.max() + 3:  # the widest point is not at the apex end
            contam['noHead'] += 1
            continue
        lab = None
        if boxes:
            near = min(texts, key=lambda t: box_dist(t['box'], tail))
            if box_dist(near['box'], tail) <= TAIL_LABEL_PX and near['text'] and not re.fullmatch(r'[*.]+', near['text']):
                lab = near['text']
        arrows.append({'label': lab, 'tail': [int(tail[0]), int(tail[1])], 'tip': [int(tip[0]), int(tip[1])], 'tipBy': how,
                       'headRatio': round(ratio, 1), 'ringBright': round(float((g[ring] >= 170).mean()), 2), 'suspect': bool((g[ring] >= 170).mean() > SUSPECT_RING), 'touchesBone': bool((ndi.binary_dilation(comps == r.label, iterations=1) & touch_zone).any())})
    marks = list(heads) + stars
    for t in texts:
        if t['text'] and re.fullmatch(r'[*.]+', t['text']) and '*' in t['text']:
            x0, y0, x1, y1 = t['box']; n = t['text'].count('*')
            for i in range(n):
                f = (i + 0.5) / n
                at = [int(round(x0 + (x1 - x0) * f)), int((y0 + y1) / 2)] if (x1 - x0) >= (y1 - y0) else [int((x0 + x1) / 2), int(round(y0 + (y1 - y0) * f))]
                marks.append({'kind': 'asterisk', 'at': at, 'approx': True})
    labels = [{'raw': t['raw'], 'text': t['text'], 'read': t['how'], 'conf': t['conf'], 'box': t['box']}
              for t in texts if not (t['text'] and re.fullmatch(r'[*.]+', t['text']))]
    return {'mask': mask, 'texts': texts, 'labels': labels, 'arrows': arrows, 'marks': marks,
            'specks': specks, 'contaminants': contam, 'thickPct': thick_pct}

# ---------------------------------------------------------------- build
def caption_cues(caps):
    c = ' '.join(caps).lower()
    return {'arrow': bool(re.search(r'\barrows?\b', c)), 'arrowhead': bool(re.search(r'arrowheads?', c)), 'asterisk': '(*)' in c or '*' in c}

def build():
    figs, order = parse_pages()
    terms = load_terms(); gids = graph_ids()
    allabbr = {}
    for fid in order:
        for p in figs[fid]['pages']:
            for k, v in abbreviations(p['caption']).items():
                allabbr.setdefault(k, set()).add(norm(v))
    site_abbr = list(allabbr)
    conflicts = {k: sorted(v) for k, v in allabbr.items() if len(v) > 1}
    for fid in order:
        get(figs[fid]['file'])
    out, summary = [], {'traced': 0, 'notTraced': 0, 'review': 0, 'captionMiss': 0}
    soft_listed = []
    for fid in order:
        F = figs[fid]; caps = [p['caption'] for p in F['pages']]
        g = gray(fid); h, w = g.shape
        _, _, thick = thick_region(g)
        thick_pct = float(thick.mean() * 100)
        abbr = {}
        for c in caps:
            abbr.update(abbreviations(c))
        pc, pf = plane_of(fid, caps[0])
        plane = pc or pf
        low = ' '.join(caps).lower()
        contrast = 'post-contrast' in low
        evidence = []
        if 'soft tissue window' in low:
            soft, evidence = True, ['caption: soft tissue window']
        elif contrast:
            soft, evidence = True, ['caption: post-contrast']
        elif fid in TABLE_SOFT:
            soft, evidence = True, ['§4.1 soft marker']
        elif fid in BONE_SATURATED:
            soft, evidence = False, ['viewed: ' + BONE_SATURATED[fid]]
        elif thick_pct >= SATURATED_PCT:
            soft, evidence = True, [f'histogram: {thick_pct:.1f}% thick saturated area']
        else:
            soft, evidence = False, ['no saturated window cue']
        if thick_pct >= SATURATED_PCT and not soft:
            evidence.append(f'histogram: {thick_pct:.1f}% thick saturated area')
        if soft and thick_pct < SATURATED_PCT:
            evidence.append(f'histogram: only {thick_pct:.1f}% thick saturated area (soft window without clipped bone)')
        t = TABLE.get(fid)
        row = {'id': fid, 'file': F['file'], 'pages': F['pages'], 'size': [w, h],
               'plane': plane, 'planeBy': ('caption' if pc else 'file name') if plane else None,
               'window': 'soft' if soft else 'bone', 'contrast': contrast, 'windowEvidence': evidence,
               'saturatedPct': round(thick_pct, 2), 'abbreviations': abbr}
        if pc and pf and pc != pf:
            row['planeNote'] = f'caption says {pc}, file name says {pf}'
        if plane is None:
            row['planeNote'] = 'neither caption nor file name gives the plane'
        # ids / role from §4.1
        ids = [i for i in (t['ids'] if t else []) if i in gids]
        missing = [i for i in (t['ids'] if t else []) if i not in gids]
        row['ids'] = ids or None
        reasons = []
        if t is None:
            reasons.append('no §4.1 row')
        else:
            if t['why']: reasons.append(t['why'])
            if missing: reasons.append(f'§4.1 id not in the graph: {", ".join(missing)}')
        if not ids:
            row['idsReason'] = '; '.join(reasons) or 'none given'
        elif reasons:
            row['idsReason'] = '; '.join(reasons)
        prop = [i for i in (t['cand'] if t else [])] + missing
        if prop: row['idCandidates'] = [{'id': i, 'inGraph': i in gids} for i in (t['cand'] if t else [])] + [{'id': i, 'inGraph': False} for i in missing]
        if t and t['new']: row['proposedNew'] = t['new']
        if t and t['mimic']: row['mimicOf'] = t['mimic']
        if t and t['note']: row['note'] = t['note']
        role = t['role'] if t else None
        row['role'] = list(role) if role else None
        if not role: row['roleReason'] = 'no §4.1 row' if t is None else 'not stated in §4.1'
        grp = next(((k, basis) for k, (members, basis) in GROUPS.items() if fid in members), None)
        row['group'] = {'id': grp[0], 'basis': grp[1], 'confirmed': None} if grp else None
        # annotation
        if soft:
            row['labels'] = None; row['arrows'] = None; row['marks'] = None
            row['arrowsReason'] = NOT_SEPARABLE
            summary['notTraced'] += 1; soft_listed.append(fid)
        else:
            tr = trace(g, abbr, site_abbr, terms, star_ok=caption_cues(caps)['asterisk'])
            for lb in tr['labels']:
                if lb['text']:
                    key = abbr.get(lb['text']) or lb['text']
                    got = terms.get(norm(key))
                    lb['ids'] = got or None
                    if not got: lb['idsReason'] = 'no crosswalk term for ' + (f'"{key}"' if lb['text'] in abbr else 'this label')
                else:
                    lb['ids'] = None; lb['idsReason'] = 'label not read'
            row['labels'] = tr['labels']; row['arrows'] = tr['arrows']; row['marks'] = tr['marks']
            cues = caption_cues(caps)
            found = {'arrow': bool(tr['arrows']), 'arrowhead': any(m['kind'] == 'arrowhead' for m in tr['marks']) or bool(tr['arrows']),
                     'asterisk': any(m['kind'] == 'asterisk' for m in tr['marks'])}
            miss = [k for k in ('arrow', 'arrowhead', 'asterisk') if cues[k] and not found[k]]
            unread = sum(1 for lb in tr['labels'] if lb['text'] is None and len(lb['raw']) <= 4)
            suspect = sum(1 for a in tr['arrows'] if a['suspect'])
            row['maskCheck'] = {'status': 'clean' if not miss and not unread else 'review', 'suspectArrows': suspect, 'specks': tr['specks'],
                                'nonAnnotation': tr['contaminants'], 'unreadShortLabels': unread,
                                'captionCues': cues, 'captionCueMissing': miss}
            summary['traced'] += 1
            summary['review'] += row['maskCheck']['status'] == 'review'
            summary['captionMiss'] += bool(miss)
        out.append(row)
        print(f"{fid:30s} {row['plane'] or '?':8s} {row['window']:4s} " + ('-' if soft else f"arrows {len(row['arrows'])} marks {len(row['marks'])} labels {len(row['labels'])} {row['maskCheck']['status']}"), flush=True)
    meta = {
        'source': 'Interactive CT Sinus Anatomy, University of Washington Department of Radiology, Seattle (http://uwmsk.org/sinusanatomy2/)',
        'credit': 'the atlas and its institution; no individual author is named (ssb/LICENSE-data.md)',
        'about': 'numbers and text only; no image is stored. Regenerate with tools/ssb-pipeline/uw/figures.py (README of this folder, "Figure inventory").',
        'method': {'seed': f'>= {HI}, outside thick bright regions (opening r={THICK_R}, parts >= {THICK_MIN} px, +1 px)', 'grow': f'>= {LO} within {REACH} px of a seed',
                   'saturatedPct': f'thick bright area >= {SATURATED_PCT}% of the image', 'tailLabelPx': TAIL_LABEL_PX, 'ocrScales': list(OCR_SCALES),
                   'ocr': 'rapidocr-onnxruntime ' + _version('rapidocr_onnxruntime')},
        'notSeparableReason': NOT_SEPARABLE,
        'count': len(out), 'placements': sum(len(f['pages']) for f in out),
        'summary': summary, 'softFigures': soft_listed,
        'abbreviationConflicts': conflicts,
        'frame': 'image px, origin top-left, as the page serves the file; left-right is not asserted',
    }
    json.dump({'meta': meta, 'figures': out}, open(OUT, 'w'), indent=1, ensure_ascii=False)
    open(OUT, 'a').write('\n')
    print(json.dumps(summary), 'conflicts', conflicts)

def _version(mod):
    try:
        from importlib.metadata import version
        return version(mod.replace('_', '-'))
    except Exception:  # noqa: BLE001
        return '?'

# ---------------------------------------------------------------- overlay (check images; never committed)
def overlay_image(fid, row):
    g = gray(fid)
    mk, _, _ = annotation_mask(g)
    im = np.stack([g] * 3, -1)
    im[mk] = (im[mk] * 0.4 + np.array([255, 160, 0]) * 0.6).astype(np.uint8)
    S = 3
    pil = Image.fromarray(im).resize((g.shape[1] * S, g.shape[0] * S), Image.NEAREST)
    d = ImageDraw.Draw(pil)
    for lb in row.get('labels') or []:
        x0, y0, x1, y1 = [v * S for v in lb['box']]
        d.rectangle([x0, y0, x1, y1], outline=(0, 255, 0) if lb['text'] else (255, 0, 255))
        d.text((x0, y1 + 2), f"{lb['text'] or '?'} ({lb['raw']})", fill=(0, 255, 0))
    for a in row.get('arrows') or []:
        t = [v * S for v in a['tip']]; s = [v * S for v in a['tail']]
        d.line([*s, *t], fill=(255, 0, 0), width=3); d.ellipse([t[0] - 12, t[1] - 12, t[0] + 12, t[1] + 12], outline=(255, 0, 0), width=4)
    for m in row.get('marks') or []:
        x, y = [v * S for v in m['at']]
        d.line([x - 12, y, x + 12, y], fill=(0, 220, 255), width=3); d.line([x, y - 12, x, y + 12], fill=(0, 220, 255), width=3)
    return pil

def load_rows():
    return {r['id']: r for r in json.load(open(OUT))['figures']}

def main(argv):
    cmd = argv[0] if argv else 'build'
    out = tempfile.gettempdir() + '/uw-figures'
    args = argv[1:]
    if '--out' in args:
        i = args.index('--out'); out = args[i + 1]; args = args[:i] + args[i + 2:]
    if os.path.abspath(out).startswith(REPO + os.sep):
        sys.exit('refusing to write check images inside the repository (no image is committed)')
    if cmd == 'build':
        build()
    elif cmd == 'overlay':
        rows = load_rows(); os.makedirs(out, exist_ok=True)
        for fid in args:
            if fid not in rows: sys.exit(f'unknown figure {fid}')
            p = os.path.join(out, fid.replace('&', '_') + '.png'); overlay_image(fid, rows[fid]).save(p); print(p)
    elif cmd == 'sheet':
        rows = [r for r in load_rows().values() if r['arrows'] is not None]; os.makedirs(out, exist_ok=True)
        per, W = 6, 560
        for n in range(0, len(rows), per):
            tiles = []
            for r in rows[n:n + per]:
                im = overlay_image(r['id'], r); im.thumbnail((W, W)); t = Image.new('RGB', (W, W + 14)); t.paste(im, (0, 14))
                ImageDraw.Draw(t).text((2, 1), f"{r['id']}  {(r.get('maskCheck') or {}).get('status')}", fill=(255, 255, 255)); tiles.append(t)
            S = Image.new('RGB', (W * 3, (W + 14) * 2))
            for i, t in enumerate(tiles): S.paste(t, ((i % 3) * W, (i // 3) * (W + 14)))
            p = os.path.join(out, f'sheet{n // per + 1:02d}.png'); S.save(p); print(p)
    else:
        sys.exit(__doc__)

if __name__ == '__main__':
    main(sys.argv[1:])
