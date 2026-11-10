"""UW label text -> canonical landmark id (+ the js/olsb/glossary.js id, or None).

The OCR text is clean after extract.py's second pass but still carries stray glyphs ('facial r recess',
'mastoid s  segment facial n n.'), so a label is normalised (lower case, punctuation and single
stray letters dropped) and matched by the first rule that fits. Rules are ordered, most specific
first. A text no rule fits is reported by landmarks.py (never silently dropped).

`canon` ids are this pipeline's own; `g` is the OLSB glossary key where one fits (checked by
landmarks.py against js/olsb/glossary.js), else None.
"""
import re

# (regex on the normalised text, canon id, glossary id or None)
RULES = [
    (r'bulb', 'jugular-bulb', 'jb'),
    (r'^laby', 'fn-labyrinthine', 'fn-lab'),
    (r'^oid segment|^e\.lbes', 'fn-mastoid', 'fn'),
    (r'^recess$|facial recess', 'facial-recess', 'recess'),
    # not 'eminence$': UW's coronal 'arcuate eminence' is another structure (the 'arcuate' rule below), and a
    # bare 'eminence' OCR fragment is ambiguous, so it matches nothing
    (r'pyramidal|pyramdidal|arndical', 'pyramidal-eminence', 'pyramid'),
    (r'tympani sinus', 'sinus-tympani', 'sinustymp'),
    (r'sapex', 'petrous-apex', None),
    (r'sica$|petrous s?ica', 'petrous-ica', 'ica'),
    (r'window.*round|round.*window', 'round-window', 'rw'),
    (r'jugula', 'jugular-foramen', None),
    (r'styloid n mastoid', 'stylomastoid-foramen', 'smf'),
    (r'labyrinthine', 'fn-labyrinthine', 'fn-lab'),
    (r'(tympanic|ant tympanic).*facial|facial.* tympanic$|^facial n tympanic', 'fn-tympanic', 'fn-tymp'),
    (r'mastoid.*(segment|secment|facial)|segment.*facial n$|^segment facial', 'fn-mastoid', 'fn'),
    (r'facial.*recess|^facial n? ?recess', 'facial-recess', 'recess'),
    (r'^facial( n)?$|^facial [a-z]$|^facial n in$|^facial n ii n$|^facial 1$', 'fn', 'fn'),
    (r'geniculate', 'geniculate-ganglion', 'geniculate'),
    (r'stylomastoid|styloid mastoid', 'stylomastoid-foramen', 'smf'),
    (r'^basal turn', 'basal-turn', None),
    (r'^middle turn|^m ?dale', 'middle-turn', None),
    (r'^apical turn', 'apical-turn', None),
    (r'^cochlea$', 'cochlea', 'cochlea'),
    (r'cochlear promontory|^promontory$', 'promontory', 'promontory'),
    (r'cochlear aqu', 'cochlear-aqueduct', None),
    (r'vestibular aqu', 'vestibular-aqueduct', None),
    (r'subarcuate', 'subarcuate-canal', None),
    (r'modiolus', 'modiolus', None),
    (r'^vestibule$', 'vestibule', 'vestibule'),
    (r'^lscc$', 'lscc', 'lscc'),
    (r'^pscc$', 'pscc', 'pscc'),
    (r'^sscc$', 'sscc', 'ssc'),
    (r'^scc$', 'sscc', 'ssc'),          # axial slices 8-12 label the arch of the superior canal "SCC"
    (r'crus communis', 'crus-communis', None),
    (r'^iac$', 'iac', 'iac'),
    (r'window', 'oval-window', 'ow'),   # after the round-window rule; OCR often drops 'oval'
    (r'sinus tympani', 'sinus-tympani', 'sinustymp'),
    
    (r'stapedius', 'stapedius', 'stapedius'),
    (r'stapes', 'stapes', 'stapes'),
    (r'incudostapedial', 'incudostapedial-joint', 'isj'),
    (r'incus.*short|short.*incus', 'incus-short-process', 'incus'),
    (r'incus.*long|long.*incus', 'incus-long-process', 'incus'),
    (r'incus', 'incus', 'incus'),
    (r'malleal ligament', 'lateral-malleal-ligament', 'lmf'),
    (r'malleus|^maleus', 'malleus', 'malleus'),
    (r'tensor tympani', 'tensor-tympani', 'tensor'),
    (r'tympanic membrane', 'tympanic-membrane', 'tm'),
    (r'annulus', 'tympanic-annulus', 'annulus'),
    (r'scutum', 'scutum', 'scutum'),
    (r'prussak', 'prussaks-space', 'prussak'),
    (r'epitympanum', 'epitympanum', 'epitympanum'),
    (r'hypotympanum', 'hypotympanum', 'hypotympanum'),
    (r'tegmen tympani', 'tegmen-tympani', 'tegment'),
    (r'aditus', 'aditus', 'aditus'),
    (r'mastoid antrum|mastod aitrum', 'mastoid-antrum', 'antrum'),
    (r'koerner', 'koerners-septum', 'koerner'),
    (r'mastoid tip', 'mastoid-tip', 'tip'),
    (r'^mastoid$', 'mastoid-cells', 'mastoidcells'),
    (r'sigmoid', 'sigmoid-sinus', 'sigmoid'),
    (r'jugular bulb', 'jugular-bulb', 'jb'),
    (r'jugular foramen|jeinbnd foramen', 'jugular-foramen', None),
    (r'jugular tubercle', 'jugular-tubercle', None),
    (r'hypoglossal', 'hypoglossal-canal', None),
    (r'petrous ica|petrous i', 'petrous-ica', 'ica'),
    (r'carotid canal', 'carotid-canal', None),
    (r'petrous apex', 'petrous-apex', None),
    (r'eustachian', 'eustachian-tube-entrance', 'et'),
    (r'^eac$', 'eac', 'eac'),
    (r'arcuate', 'arcuate-eminence', None),
    (r'pinna', 'pinna', 'auricle'),
    (r'foramen ovale', 'foramen-ovale', None),
    (r'foramen spinosum', 'foramen-spinosum', None),
    (r'clivus', 'clivus', None),
    (r'clinoid', 'anterior-clinoid', None),
    (r'vidian', 'vidian-canal', None),
    (r'mandibular condyle', 'mandibular-condyle', None),
    (r'occipito.?mastoid', 'occipitomastoid-suture', None),
    (r'petro.?occipital', 'petro-occipital-synchondrosis', None),
    (r'f[ea]cial', 'fn', 'fn'),     # last resort for a mangled 'facial n.'
]


def norm(text):
    t = text.lower().replace('^', ' ').replace('_', ' ')
    t = re.sub(r"[^a-z0-9' ]", ' ', t).replace("'", ' ')
    toks = [w for w in t.split() if len(w) > 1 or w in ('n', 'r', 'i', '1')]
    # OCR doubles: 'tympanic c membrane', 'sigmoid s sinus', 'geniculate e ganglion', 'mastoid s segment'
    out = []
    for w in toks:
        if w == 'n' and out and out[-1] == 'n':
            continue
        out.append(w)
    return ' '.join(out)


def canon(text):
    """-> (canon id, glossary id) or (None, None)."""
    t = norm(text)
    # a leading 'process'/'window' fragment from a split two-line label is handled by extract.merge_lines
    t2 = re.sub(r'\b(s|c|e|a|v|t|u)\b', ' ', t)   # stray single-letter OCR doubles
    t2 = re.sub(r'\s+', ' ', t2).strip()
    for pat, cid, gid in RULES:
        if re.search(pat, t) or re.search(pat, t2):
            return cid, gid
    return None, None
