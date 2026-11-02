/* =================================================================
   Normal Ear Anatomy: Outer and Middle Ear
   OKSAT · Otology Module
   ================================================================= */
/* Companion question module of the Interactive learning guide
   `ear-anatomy` (plan plans/2026-11-02-ear-anatomy-guide.md). Concept
   keys are the guide's section ids, so every drill row resolves one to
   one. Wave 2 (R1) covers orientation, auricle, EAC, TM, tympanic cavity
   and ossicles; later waves append items (new ids, never renumbered).

   Sources, ranked: Cummings Review of Otolaryngology (2017) Ch. 2;
   Glasscock-Shambaugh Surgery of the Ear 5e (2003) Ch. 1-3 (Gulya;
   Rosowski and Merchant); Goldenberg and Goldstein, Handbook of
   Otolaryngology 2e (2018) Ch. 3; Baker, Local Flaps 3e Ch. 22 (auricle
   proportions, as cited by the otoplasty module); stapes footplate
   morphometry (Folia Morphologica 2024; micro-CT series, J Otolaryngol
   Head Neck Surg 2021). KJ Lee could not be text-extracted (empty
   result) and is not cited. Where sources disagree the explanation says
   so under "Discrepancy:". No figures. Draft: the owner verifies. */

const meta = {
    title: 'Normal Ear\nAnatomy',
    subtitle:
        'Auricle to ossicles as a relational map: orientation and the temporal bone, the auricle and its supply, the canal, the drum, the six walls of the tympanic cavity, and the ossicular chain. Each concept matches a section of the Interactive learning guide.',
    kicker: 'Self-Assessment · Otology Module',
    id: 'ear-anatomy',
    sources: [
        'Lin HW, Roberts DS, Harris JP. Cummings Review of Otolaryngology. Elsevier, 2017 — Ch. 2, temporal bone, EAC, eardrum, middle ear, facial nerve, middle ear mechanics',
        'Glasscock ME, Gulya AJ, eds. Glasscock-Shambaugh Surgery of the Ear, 5e. BC Decker, 2003 — Ch. 1 (developmental anatomy), Ch. 2 (anatomy of the ear and temporal bone, Gulya), Ch. 3 (auditory physiology)',
        'Goldenberg D, Goldstein BJ. Handbook of Otolaryngology–Head and Neck Surgery, 2e. Thieme, 2018 — Ch. 3, embryology and anatomy of the ear',
        'Baker SR. Local Flaps in Facial Reconstruction, 3e, Ch. 22 — auricle proportions, as cited in the otoplasty module',
        'Stapes footplate morphometry: Folia Morphologica 2024;83(2) (length 2.93, width 1.46 mm); micro-CT of Thiel-embalmed temporal bones, J Otolaryngol Head Neck Surg 2021 (length 2.71, width 1.23 mm)',
    ],
};

const DOMAINS = {
    orientation: { label: 'Orientation & Temporal Bone', color: '#2F6E6A', hex: 'rgba(47,110,106,0.14)' },
    auricle:     { label: 'Auricle',                     color: '#7A5A3A', hex: 'rgba(122,90,58,0.13)' },
    eac:         { label: 'External Auditory Canal',     color: '#4A5C6B', hex: 'rgba(74,92,107,0.14)' },
    tm:          { label: 'Tympanic Membrane',           color: '#6E4A6B', hex: 'rgba(110,74,107,0.14)' },
    cavity:      { label: 'Tympanic Cavity',             color: '#4E6B4A', hex: 'rgba(78,107,74,0.14)' },
    ossicles:    { label: 'Ossicular Chain',             color: '#A0635E', hex: 'rgba(160,99,94,0.14)' },
};

const CONCEPTS = {
    // orientation
    'or-views':       { label: 'Views and Laterality',        domain: 'orientation' },
    'or-parts':       { label: 'Temporal Bone Parts',         domain: 'orientation' },
    'or-map':         { label: 'Compartment Map',             domain: 'orientation' },
    // auricle
    'au-topo':        { label: 'Auricle Topography',          domain: 'auricle' },
    'au-cart':        { label: 'Cartilage and Skin',          domain: 'auricle' },
    'au-muscle':      { label: 'Auricular Muscles',           domain: 'auricle' },
    'au-vessel':      { label: 'Auricle Vessels and Lymph',   domain: 'auricle' },
    'au-nerve':       { label: 'Auricle Sensory Map',         domain: 'auricle' },
    'au-dev':         { label: 'Auricle Development',         domain: 'auricle' },
    // EAC
    'eac-seg':        { label: 'Canal Segments',              domain: 'eac' },
    'eac-skin':       { label: 'Canal Skin',                  domain: 'eac' },
    'eac-walls':      { label: 'Canal Walls and Sutures',     domain: 'eac' },
    'eac-gaps':       { label: 'Santorini and Huschke',       domain: 'eac' },
    'eac-rel':        { label: 'Canal Relations',             domain: 'eac' },
    'eac-nerve':      { label: 'Canal Innervation',           domain: 'eac' },
    // TM
    'tm-geo':         { label: 'Drum Geometry',               domain: 'tm' },
    'tm-layers':      { label: 'Tensa and Flaccida',          domain: 'tm' },
    'tm-marks':       { label: 'Drum Landmarks',              domain: 'tm' },
    'tm-quad':        { label: 'Behind Each Quadrant',        domain: 'tm' },
    'tm-supply':      { label: 'Drum Supply',                 domain: 'tm' },
    'tm-dev':         { label: 'Drum Development',            domain: 'tm' },
    // cavity
    'cav-box':        { label: 'Six-Walled Box',              domain: 'cavity' },
    'cav-lateral':    { label: 'Lateral Wall',                domain: 'cavity' },
    'cav-medial':     { label: 'Medial Wall',                 domain: 'cavity' },
    'cav-roof-floor': { label: 'Roof and Floor',              domain: 'cavity' },
    'cav-anterior':   { label: 'Anterior Wall',               domain: 'cavity' },
    'cav-posterior':  { label: 'Posterior Wall',              domain: 'cavity' },
    // ossicles
    'os-parts':       { label: 'Ossicle Parts',               domain: 'ossicles' },
    'os-joints':      { label: 'Joints, Ligaments, Axis',     domain: 'ossicles' },
    'os-tensor':      { label: 'Tensor Tympani',              domain: 'ossicles' },
    'os-stapedius':   { label: 'Stapedius and the Reflex',    domain: 'ossicles' },
    'os-supply':      { label: 'Ossicular Blood Supply',      domain: 'ossicles' },
    'os-dev':         { label: 'Ossicular Embryology',        domain: 'ossicles' },
};

const ITEMS = [

// ════════ ORIENTATION ════════
{
    id: 'q1', section: 'Orientation',
    stem: 'An otoscopic photograph shows the manubrium slanting down and to the viewer\'s right from the lateral process, with the cone of light at 7 o\'clock. Which ear is it?',
    options: [
        { id: 'a', text: 'Left ear' },
        { id: 'b', text: 'Right ear' },
        { id: 'c', text: 'Cannot be told without the canal walls' },
        { id: 'd', text: 'Right ear, because the light reflex is always at 7 o\'clock' },
    ],
    correct: 'a',
    brief: 'The cone of light points anteroinferiorly: 5 o\'clock in a right ear, 7 o\'clock in a left. The umbo sits posteroinferior to the lateral process.',
    detailed: 'Mechanism: the drum is a cone with its apex (umbo) medial, so the light reflex forms where the surface faces the examiner most directly, in the anteroinferior quadrant. Through the speculum the patient\'s anterior is toward the face: viewer\'s right in a right ear, viewer\'s left in a left ear. The manubrium runs from the lateral process posteroinferiorly to the umbo, so in a left ear it slants toward the viewer\'s right (posterior).\nApplication: call the side from two landmarks, the manubrium slope and the light reflex, before naming any quadrant.\nPearl: in an endoscopic or rotated image the clock face moves; the manubrium does not lie.',
    concepts: ['or-views', 'tm-marks'],
},
{
    id: 'q2', type: 'recall', section: 'Orientation',
    stem: 'Name the parts of the temporal bone and the bony wall of the external canal each builds.',
    answer: `• Squamous: superior and posterosuperior canal wall; scutum; zygomatic root
• Tympanic: anterior, inferior and part of the posterior canal wall; the tympanic sulcus
• Mastoid: the mastoid process behind the canal
• Petrous: medial wall of the tympanic cavity, otic capsule, tegmen, carotid canal, jugular fossa
• Styloid process: counted as a fifth part by some sources, not by others`,
    brief: 'Squama above and behind, tympanic bone in front and below, petrous medially.',
    detailed: 'Cummings Review lists four portions (squamous, petrous, tympanic, mastoid). Glasscock\'s development chapter calls the temporal bone an amalgam of five bones including the styloid, while its anatomy chapter says the styloid is closely related but not part of it.\nApplication: the tympanomeatal flap is raised from the squama above (tympanosquamous suture) and the tympanic bone behind (tympanomastoid suture).\nDiscrepancy: four versus five parts depends on whether the styloid is counted.',
    concepts: ['or-parts'],
},
{
    id: 'q3', section: 'Orientation',
    stem: 'Which three structures pass through the petrotympanic (Glaserian) fissure?',
    options: [
        { id: 'a', text: 'Arnold nerve, stylomastoid artery, posterior auricular vein' },
        { id: 'b', text: 'Lesser petrosal nerve, superior tympanic artery, tensor tendon' },
        { id: 'c', text: 'Chorda tympani, anterior malleal ligament with the anterior process, anterior tympanic artery' },
        { id: 'd', text: 'Jacobson nerve, inferior tympanic artery, caroticotympanic nerves' },
    ],
    correct: 'c',
    brief: 'Chorda out, anterior malleal ligament and anterior process, anterior tympanic artery in.',
    detailed: 'Mechanism: the fissure is the seam between the tympanic bone and the petrosa, at the anterior tympanic cavity, so what tethers the malleus anteriorly and the vessel and nerve that use the anterior route pass through it. The chorda leaves the middle ear through the canal of Huguier beside it.\nApplication: Arnold nerve uses the tympanomastoid suture (option a), and Jacobson nerve with the inferior tympanic artery uses the inferior tympanic canaliculus (option d).\nPearl: one seam per nerve: tympanomastoid for Arnold, petrotympanic for the chorda.',
    concepts: ['or-parts', 'cav-lateral'],
},
{
    id: 'q4', section: 'Orientation',
    stem: 'The middle ear compartments are defined by projecting the drum margins medially. What lies above the plane through the anterior and posterior tympanic spines?',
    options: [
        { id: 'a', text: 'Mesotympanum' },
        { id: 'b', text: 'Protympanum' },
        { id: 'c', text: 'Retrotympanum' },
        { id: 'd', text: 'Epitympanum' },
    ],
    correct: 'd',
    brief: 'Epitympanum (attic) above the spines; mesotympanum behind the drum; hypotympanum below it; protympanum in front; retrotympanum behind.',
    detailed: 'Glasscock defines the epitympanum as the space above the plane of the anterior and posterior tympanic spines, and the meso-, hypo-, pro- and posterior tympanic spaces by planes extended from the annulus. The spines bound the notch of Rivinus.\nApplication: a pars flaccida retraction opens into the epitympanum (Prussak space), not the mesotympanum.\nPearl: the drum is the window; each compartment is named for where it sits relative to that window.',
    concepts: ['or-map'],
},
{
    id: 'q5', type: 'recall', section: 'Orientation',
    stem: 'Name the five middle ear compartments and the boundary that defines each.',
    answer: `• Epitympanum: above the plane of the tympanic spines (notch of Rivinus)
• Mesotympanum: directly medial to the pars tensa
• Hypotympanum: below the inferior annulus
• Protympanum: anterior to the anterior annulus, around the Eustachian tube orifice
• Retrotympanum: posterior to the posterior annulus (facial recess, sinus tympani)`,
    brief: 'Five spaces, all named against the margins of the drum.',
    detailed: 'Glasscock calls the retrotympanum the posterior tympanic cavity; the Handbook treats the protympanum as the anterior portion of the mesotympanum where the Eustachian tube opens.\nApplication: what an otoscope cannot see is the epitympanum, the retrotympanum and the anterior protympanum.',
    concepts: ['or-map'],
},

// ════════ AURICLE ════════
{
    id: 'q6', section: 'Auricle',
    stem: 'An endaural incision is placed between the tragus and the helical crus. Which property of that site makes it the classic access point?',
    options: [
        { id: 'a', text: 'It is the incisura terminalis, a gap in the cartilage between the auricle and the canal' },
        { id: 'b', text: 'It overlies the tympanosquamous suture, which is avascular' },
        { id: 'c', text: 'It lies in the great auricular territory, so a single block anesthetizes it' },
        { id: 'd', text: 'It is where the bony canal begins' },
    ],
    correct: 'a',
    brief: 'The incisura terminalis is cartilage-free, so an incision there avoids cutting cartilage and the risk of perichondritis.',
    detailed: 'Glasscock: the lateral third of the canal continues the cartilage of the pinna and is deficient superiorly at the incisura terminalis; the extracartilaginous endaural incision uses this gap.\nApplication: the same gap means a superior canal infection can reach the soft tissue in front of the helix.\nPearl: two places have no cartilage: the lobule and the incisura terminalis.',
    concepts: ['au-topo', 'au-cart'],
},
{
    id: 'q7', type: 'recall', section: 'Auricle',
    stem: 'List the landmarks of the lateral auricle, from the rim inward.',
    answer: `• Helix (rim), helical crus and helical spine; Darwin tubercle on the posterosuperior helix
• Scapha (between helix and antihelix)
• Antihelix with its superior and inferior crura; triangular fossa between the crura
• Concha: cymba above the helical crus, cavum below it
• Tragus, antitragus, intertragic notch, incisura terminalis
• Lobule (no cartilage)`,
    brief: 'Rim, groove, fold, bowl, the two flaps around the canal, and the lobule.',
    detailed: 'The helical crus divides the concha into the cymba (above) and the cavum (below); the cavum leads into the canal.\nApplication: the cavum and the canal share sensory supply from Arnold nerve and the facial nerve, which is why a ring block leaves the concha sensate.',
    concepts: ['au-topo'],
},
{
    id: 'q8', section: 'Auricle',
    stem: 'After blunt trauma, blood collects on the lateral surface of the auricle. Why is the cartilage at risk if it is not drained?',
    options: [
        { id: 'a', text: 'The cartilage has its own end arteries, which the hematoma compresses' },
        { id: 'b', text: 'Hyaline cartilage calcifies under pressure' },
        { id: 'c', text: 'The lobule cartilage is thin and necroses first' },
        { id: 'd', text: 'The cartilage is avascular and fed by the perichondrium, which the hematoma lifts off it' },
    ],
    correct: 'd',
    brief: 'The blood separates perichondrium from cartilage; the cartilage loses its nutrition, then necroses and is replaced by fibrous tissue (cauliflower ear).',
    detailed: 'Mechanism: auricular cartilage is elastic and avascular. On the lateral surface the skin is bound tightly to the perichondrium with almost no subcutis, so fluid collects in the subperichondrial plane.\nApplication: drain and bolster to close that plane.\nCaveat: the lobule has no cartilage at all (option c).\nPearl: tight lateral skin explains both the hematoma plane and why lateral skin defects rarely close primarily.',
    concepts: ['au-cart'],
},
{
    id: 'q9', section: 'Auricle',
    stem: 'Which nerve supplies the posterior auricular muscle?',
    options: [
        { id: 'a', text: 'Great auricular nerve' },
        { id: 'b', text: 'Posterior auricular branch of the facial nerve' },
        { id: 'c', text: 'Auriculotemporal nerve' },
        { id: 'd', text: 'Lesser occipital nerve' },
    ],
    correct: 'b',
    brief: 'The extrinsic auricular muscles are facial nerve muscles (second arch): anterior and superior from the temporal branch, posterior from the posterior auricular branch.',
    detailed: 'Glasscock: the auricle attaches to the skull by skin, ligaments, three extrinsic and six intrinsic muscles; the posterior auricular nerve, a branch of the facial nerve, innervates the intrinsic muscles.\nApplication: the great auricular, lesser occipital and auriculotemporal nerves are sensory to the auricle; none is motor here.\nPearl: these muscles are the first facial nerve targets the guide meets outside the temporal bone.',
    concepts: ['au-muscle'],
},
{
    id: 'q10', type: 'recall', section: 'Auricle',
    stem: 'Name the arterial supply and the lymphatic basins of the auricle.',
    answer: `• Arteries (external carotid): superficial temporal (anterior auricular branches, anterior surface) and posterior auricular (medial surface, with perforators to the concha and lateral surface)
• Veins: with the arteries, to the external jugular or facial veins, then the internal jugular
• Lymph: anterior surface and tragus to preauricular (parotid) nodes; posterior and superior auricle to retroauricular (mastoid) nodes; lobule and concha to infra-auricular and upper cervical nodes`,
    brief: 'Two arteries, three nodal basins.',
    detailed: 'Cummings Review and Glasscock give the superficial temporal artery anteriorly and the posterior auricular artery posteriorly. Glasscock adds that the posterior auricular artery gives the stylomastoid branch, which enters the fallopian canal to supply the facial nerve.\nApplication: a lateral helical lesion drains to the parotid nodes; a lobule lesion to the upper neck.\nCaveat: the lymphatic map is standard teaching, not stated in the ranked sources.',
    concepts: ['au-vessel'],
},
{
    id: 'q11', section: 'Auricle',
    stem: 'A field block around the base of the auricle leaves which territory sensate?',
    options: [
        { id: 'a', text: 'The lobule' },
        { id: 'b', text: 'The helical rim' },
        { id: 'c', text: 'The concha and the external canal' },
        { id: 'd', text: 'The medial surface of the auricle' },
    ],
    correct: 'c',
    brief: 'Arnold nerve (X) and the sensory branch of the facial nerve reach the concha and canal from deep, inside the ring.',
    detailed: 'Glasscock lists the auriculotemporal nerve, great auricular nerve, lesser occipital nerve, Arnold nerve and facial twigs as the sensory supply of the pinna and canal. The cervical nerves and the auriculotemporal nerve enter from the periphery, so a ring catches them; Arnold nerve and the facial twigs arrive through the canal and the tympanomastoid region.\nApplication: for canal surgery Glasscock adds infiltration of the cartilaginous canal in four quadrants (2, 4, 8 and 10 o\'clock).\nPearl: block the ring, then inject the canal.',
    concepts: ['au-nerve'],
},
{
    id: 'q12', section: 'Auricle',
    stem: 'Touching the posterior canal wall makes a patient cough. Which nerve carries the afferent limb?',
    options: [
        { id: 'a', text: 'Auricular branch of the vagus (Arnold nerve)' },
        { id: 'b', text: 'Tympanic branch of the glossopharyngeal (Jacobson nerve)' },
        { id: 'c', text: 'Great auricular nerve' },
        { id: 'd', text: 'Chorda tympani' },
    ],
    correct: 'a',
    brief: 'Arnold reflex: vagal afferents from the canal trigger a cough.',
    detailed: 'The Handbook names the cough on canal manipulation Arnold\'s reflex. Arnold nerve reaches the canal through the tympanomastoid suture.\nApplication: the same nerve explains referred otalgia from the larynx and hypopharynx.\nPearl: Jacobson (IX) is on the promontory, not the canal skin.',
    concepts: ['au-nerve', 'eac-nerve'],
},
{
    id: 'q13', section: 'Auricle',
    stem: 'In the board version of auricular development, which structure comes from hillock 1?',
    options: [
        { id: 'a', text: 'Lobule' },
        { id: 'b', text: 'Antitragus' },
        { id: 'c', text: 'Helix' },
        { id: 'd', text: 'Tragus' },
    ],
    correct: 'd',
    brief: 'Hillocks 1–3 (first arch): tragus, helical crus, helix. Hillocks 4–6 (second arch): antihelix, antitragus and lobule.',
    detailed: 'The Handbook\'s table: 1 tragus, 2 crus of helix, 3 helix (arch 1); 4 crus of antihelix, 5 antihelix, 6 antitragus and lobule (arch 2), with a note that the contributions of 4 to 6 remain controversial. Glasscock adds that some studies give the second arch most of the auricle and others a balanced share.\nApplication: first-arch defects travel with the tragus and with first-arch syndromes.\nDiscrepancy: the 4–6 assignments differ between sources; commit to 1–3.',
    concepts: ['au-dev'],
},
{
    id: 'q14', type: 'recall', section: 'Auricle',
    stem: 'Give the normal auricular proportions used to judge a prominent or small ear.',
    answer: `• Height 5.5–6.5 cm; width about 55% of height
• Long axis tilted about 15° posteriorly
• Conchoscaphal angle about 90°
• Auriculocephalic angle 20–30°
• About 85% of adult size by age 5`,
    brief: 'Numbers frame the examination; asymmetry matters more than an absolute value.',
    detailed: 'Proportions follow Baker, Local Flaps 3e Ch. 22, as cited by the otoplasty module; the 85% by age 5 is from the Handbook.\nDiscrepancy: the plan draft gave a 15–20° axis tilt and 15–20 mm helix to scalp; the otoplasty sources give about 15° and graded distances of 10–12, 16–18 and about 20 mm from top to bottom.',
    concepts: ['au-dev'],
},

// ════════ EAC ════════
{
    id: 'q15', section: 'External Auditory Canal',
    stem: 'Where is the narrowest part of the adult external auditory canal?',
    options: [
        { id: 'a', text: 'At the conchal opening' },
        { id: 'b', text: 'Just medial to the bony-cartilaginous junction (the isthmus)' },
        { id: 'c', text: 'At the anterior tympanomeatal recess' },
        { id: 'd', text: 'At the notch of Rivinus' },
    ],
    correct: 'b',
    brief: 'The isthmus lies just medial to the bony-cartilaginous junction; a foreign body pushed past it is hard to retrieve.',
    detailed: 'Glasscock: the canal is about 2.5 cm long, its lateral third cartilaginous, medial two thirds bony, and its narrowest point the isthmus just medial to the junction.\nApplication: medial to the isthmus the canal widens into the deep anterior recess, where debris and foreign bodies hide.\nPearl: grasp a foreign body lateral to the isthmus or not at all.',
    concepts: ['eac-seg'],
},
{
    id: 'q16', section: 'External Auditory Canal',
    stem: 'To straighten the canal for otoscopy, the auricle of an adult is pulled in which direction, and that of an infant in which?',
    options: [
        { id: 'a', text: 'Adult up and back; infant down and back' },
        { id: 'b', text: 'Adult down and back; infant up and back' },
        { id: 'c', text: 'Both forward' },
        { id: 'd', text: 'Adult forward; infant down' },
    ],
    correct: 'a',
    brief: 'The adult canal is S-shaped and straightens posterosuperiorly; the infant canal, without a bony lateral extension, straightens posteroinferiorly.',
    detailed: 'Mechanism: the infant tympanic bone is a flat ring that only grows laterally after birth (Glasscock), so the infant canal is mostly cartilage and the drum lies nearly horizontal.\nApplication: in a neonate the drum is seen obliquely and looks smaller than it is.',
    concepts: ['eac-seg', 'tm-geo'],
},
{
    id: 'q17', section: 'External Auditory Canal',
    stem: 'A furuncle forms in the ear canal. In which part, and why there?',
    options: [
        { id: 'a', text: 'Bony canal, because its skin lies on periosteum' },
        { id: 'b', text: 'Anterior tympanomeatal recess, because debris collects there' },
        { id: 'c', text: 'Cartilaginous canal, because only it has hair follicles and glands' },
        { id: 'd', text: 'Pars flaccida, because it has no fibrous layer' },
    ],
    correct: 'c',
    brief: 'A furuncle is a follicular infection; hair follicles, sebaceous and cerumen glands exist only in the cartilaginous canal.',
    detailed: 'The Handbook: cartilaginous canal skin is thick with hair follicles and sebaceous and ceruminous glands; bony canal skin is thin, has no adnexa or subcutis, and is the only skin in the body lying directly on periosteum. Glasscock: the absence of hair distinguishes the bony canal.\nApplication: bony canal skin tears easily and is very pain-sensitive, which is why injection there raises a bleb and must be gentle.',
    concepts: ['eac-skin'],
},
{
    id: 'q18', section: 'External Auditory Canal',
    stem: 'The vascular strip incisions of a tympanomastoid approach follow which two landmarks?',
    options: [
        { id: 'a', text: 'Petrotympanic fissure and petrosquamous suture' },
        { id: 'b', text: 'Notch of Rivinus and the anterior annulus' },
        { id: 'c', text: 'Incisura terminalis and the intertragic notch' },
        { id: 'd', text: 'Tympanosquamous and tympanomastoid sutures' },
    ],
    correct: 'd',
    brief: 'The two sutures bound the squamous strip of the posterosuperior canal; the skin is anchored along them and needs sharp elevation.',
    detailed: 'Glasscock: the tympanosquamous and tympanomastoid sutures are the landmarks for the vascular strip; well-placed canal infiltration outlines them because the skin is anchored there. Elevation over them often needs sharp division of the periosteum, especially at the tympanosquamous suture.\nApplication: Arnold nerve traverses the tympanomastoid suture.\nPearl: the strip runs between the two sutures, superior to posterior.',
    concepts: ['eac-walls'],
},
{
    id: 'q19', section: 'External Auditory Canal',
    stem: 'Necrotizing otitis externa spreads from the canal to the parotid and the temporomandibular joint through which natural openings?',
    options: [
        { id: 'a', text: 'Fissures of Santorini (cartilaginous canal) and a patent foramen of Huschke (bony canal)' },
        { id: 'b', text: 'Petrotympanic fissure and canal of Huguier' },
        { id: 'c', text: 'Mastoid canaliculus and inferior tympanic canaliculus' },
        { id: 'd', text: 'Notch of Rivinus and the iter chordae posterius' },
    ],
    correct: 'a',
    brief: 'Santorini fissures in the anterior cartilaginous canal lead to the superficial parotid; a patent foramen of Huschke in the anteroinferior bony wall leads to the deep parotid and the TMJ.',
    detailed: 'Cummings Review: Santorini fissures allow spread to the superficial parotid; the foramen of Huschke, an anteroinferior bony defect that usually obliterates during development, allows spread to the deep lobe and the TMJ. Glasscock: the foramen forms around age 1 as opposing spurs of the growing tympanic ring fuse, and closes in late childhood.\nDiscrepancy: sources differ on the timing of closure. Glasscock (after Anson) says late childhood; common teaching gives about age 5.',
    concepts: ['eac-gaps'],
},
{
    id: 'q20', type: 'recall', section: 'External Auditory Canal',
    stem: 'Name the relations of the bony external canal in each direction.',
    answer: `• Anterior: temporomandibular joint (glenoid fossa), parotid
• Posterior: mastoid air cells; the mastoid facial nerve deep to the posterior canal near the annulus
• Superior: epitympanum and middle fossa dura
• Inferior: parotid and the styloid process
• Medial: tympanic membrane
• Lateral: cartilaginous canal`,
    brief: 'TMJ in front, mastoid behind, middle fossa above, parotid below, drum at the end.',
    detailed: 'Glasscock: overzealous anterior canalplasty can let the TMJ prolapse into the canal when the mouth opens; TMJ and molar disease refer pain to the ear through V3. Cummings Review: in its lower course the mastoid facial nerve lies lateral to the tympanic annulus, so canal surgery can injure it.',
    concepts: ['eac-rel'],
},
{
    id: 'q21', section: 'External Auditory Canal',
    stem: 'A patient with a cerebellopontine angle tumor has numbness of the posterior canal wall. What is this sign and which nerve does it test?',
    options: [
        { id: 'a', text: 'Arnold reflex; the vagus' },
        { id: 'b', text: 'Hennebert sign; the vestibular nerve' },
        { id: 'c', text: 'Hitselberger sign; sensory fibres of the facial nerve' },
        { id: 'd', text: 'Tullio phenomenon; the stapedius' },
    ],
    correct: 'c',
    brief: 'The posterior canal skin carries facial nerve sensory fibres; their loss is the Hitselberger sign.',
    detailed: 'The Handbook spells it Hitzelberger: numbness over the posterior canal from impaired facial nerve function due to a cerebellopontine angle tumor. Cummings Review lists the somatic sensory fibres of the facial nerve as supplying the posterior canal and conchal skin.\nApplication: anterior and superior canal walls are auriculotemporal (V3); posterior and inferior walls are Arnold (X) plus VII.',
    concepts: ['eac-nerve'],
},

// ════════ TYMPANIC MEMBRANE ════════
{
    id: 'q22', section: 'Tympanic Membrane',
    stem: 'Why is the neonatal drum hard to see in full on otoscopy?',
    options: [
        { id: 'a', text: 'It is thicker than the adult drum' },
        { id: 'b', text: 'It lies nearly horizontal and reaches adult angulation only by age 4 or 5' },
        { id: 'c', text: 'It has no pars flaccida yet' },
        { id: 'd', text: 'The bony canal is longer in neonates' },
    ],
    correct: 'b',
    brief: 'Lateral growth of the tympanic ring after birth tilts the drum from nearly horizontal to the adult acute angle.',
    detailed: 'Glasscock: postnatal lateral extensions of the tympanic ring and the squama lengthen the canal and carry the drum from the nearly horizontal neonatal orientation to the adult angulation by age 4 or 5 years. The adult drum subtends an acute angle with the inferior canal wall.\nApplication: in infants, pull the auricle down and back and expect a foreshortened drum.',
    concepts: ['tm-geo'],
},
{
    id: 'q23', section: 'Tympanic Membrane',
    stem: 'The area ratio of drum to footplate is usually quoted as about how much, and worth how many decibels?',
    options: [
        { id: 'a', text: '1.3:1, about 2 dB' },
        { id: 'b', text: '5:1, about 14 dB' },
        { id: 'c', text: '20:1, about 26 dB' },
        { id: 'd', text: '100:1, about 40 dB' },
    ],
    correct: 'c',
    brief: 'About 20:1 for about 26 dB; the ossicular lever adds about 1.3:1 for about 2 dB, a theoretical 28 dB.',
    detailed: 'Glasscock and Cummings Review both give the drum-to-footplate ratio as 20:1 (26 dB) and the lever as 1.3:1 (about 2 dB), so the ideal gain is about 28 dB; Cummings Review gives the actual gain as about 20 dB, and Glasscock shows that the measured gain is frequency dependent.\nDiscrepancy: ratios computed from the effective (vibrating) area are lower. Britannica gives a total area of about 69 mm², an effective area of about 43 mm², and a footplate of 3.2 mm², a ratio near 13.\nPearl: the area ratio does most of the work; the lever is a small correction.',
    concepts: ['tm-geo', 'os-joints'],
},
{
    id: 'q24', section: 'Tympanic Membrane',
    stem: 'Which layer of the drum is absent or disorganized in the pars flaccida?',
    options: [
        { id: 'a', text: 'Squamous epithelium' },
        { id: 'b', text: 'Mucosa' },
        { id: 'c', text: 'Fibrous middle layer (lamina propria)' },
        { id: 'd', text: 'Perichondrium' },
    ],
    correct: 'c',
    brief: 'The pars flaccida has no organized fibrous layer and no annulus, so it retracts under negative pressure.',
    detailed: 'Cummings Review: the pars flaccida has no fibrous layer between the keratinizing epithelium and the mucosa. The Handbook: above the tympanic notch the middle layer is less organized. The tensa\'s lamina propria has radial and circular fibres (Handbook).\nApplication: this is why attic retraction pockets begin in the flaccida.\nPearl: no fibrous layer, no annulus: the flaccida attaches straight to bone at the notch of Rivinus.',
    concepts: ['tm-layers'],
},
{
    id: 'q25', section: 'Tympanic Membrane',
    stem: 'At which two points is the drum firmly attached to the malleus?',
    options: [
        { id: 'a', text: 'Lateral process and umbo' },
        { id: 'b', text: 'Head and neck' },
        { id: 'c', text: 'Anterior process and neck' },
        { id: 'd', text: 'Along the whole manubrium equally' },
    ],
    correct: 'a',
    brief: 'Firm at the lateral process and the umbo; between them only a mucosal fold (plica mallearis) connects drum and handle.',
    detailed: 'Glasscock: the pars propria splits at the umbo to envelop the tip of the manubrium, and the cartilaginous cap of the lateral process merges with the pars propria; between the two points only a flimsy fold joins them.\nApplication: in tympanoplasty, dissect the drum off the lateral process sharply rather than peeling it from the cap.',
    concepts: ['tm-layers', 'tm-marks'],
},
{
    id: 'q26', type: 'recall', section: 'Tympanic Membrane',
    stem: 'List the landmarks of a normal drum on otoscopy, including those seen through it.',
    answer: `• Lateral process of the malleus; manubrium; umbo
• Anterior and posterior malleal folds, and the pars flaccida above them
• Cone of light, anteroinferior
• Annulus (absent along the pars flaccida)
• Through the drum: long process of the incus, promontory, often the round window niche, sometimes the chorda and the Eustachian tube opening`,
    brief: 'Malleus landmarks, folds and flaccida, light reflex, annulus, then what shows through.',
    detailed: 'This is Cummings Review Fig. 2.5 (a left drum), which also marks the anterior and posterior tympanic spines bordering the notch of Rivinus.',
    concepts: ['tm-marks'],
},
{
    id: 'q27', section: 'Tympanic Membrane',
    stem: 'A myringotomy is placed in the anteroinferior quadrant rather than the posterosuperior. What lies behind the posterosuperior quadrant that the anteroinferior site avoids?',
    options: [
        { id: 'a', text: 'The Eustachian tube orifice and the carotid canal' },
        { id: 'b', text: 'The incus long process, incudostapedial joint, stapes and chorda tympani' },
        { id: 'c', text: 'The round window and jugular bulb' },
        { id: 'd', text: 'The tensor tendon and cochleariform process' },
    ],
    correct: 'b',
    brief: 'The posterosuperior quadrant overlies the incus, stapes and chorda; the anteroinferior quadrant overlies the protympanum.',
    detailed: 'What lies behind each quadrant: anterosuperior, the tensor tendon and cochleariform process; anteroinferior, the protympanum and Eustachian tube orifice; posterosuperior, the incus long process, incudostapedial joint, stapes, stapedius tendon and chorda, with the tympanic facial nerve above; posteroinferior, the round window niche, sinus tympani region and hypotympanum.\nApplication: a high or dehiscent jugular bulb makes the posteroinferior quadrant unsafe too.',
    concepts: ['tm-quad'],
},
{
    id: 'q28', type: 'recall', section: 'Tympanic Membrane',
    stem: 'State the sensory nerves of the lateral and medial surfaces of the drum.',
    answer: `• Lateral, anterior half: auriculotemporal nerve (V3)
• Lateral, posterior half: Arnold nerve (X), with facial nerve fibres
• Medial surface: Jacobson nerve (IX) through the tympanic plexus`,
    brief: 'Three cranial nerves on one membrane: V3 and X outside, IX inside.',
    detailed: 'Arterial supply follows the same split: the deep auricular artery (maxillary) on the lateral face; the anterior tympanic and the stylomastoid (posterior tympanic) arteries on the medial face.\nApplication: canal anesthesia does not numb the mucosal face; an awake myringotomy uses topical anesthesia on the drum.',
    concepts: ['tm-supply'],
},
{
    id: 'q29', section: 'Tympanic Membrane',
    stem: 'Which germ layers form the three layers of the tympanic membrane, lateral to medial?',
    options: [
        { id: 'a', text: 'Endoderm, mesoderm, ectoderm' },
        { id: 'b', text: 'Ectoderm, mesoderm, endoderm' },
        { id: 'c', text: 'Ectoderm only, folded three times' },
        { id: 'd', text: 'Mesoderm, ectoderm, endoderm' },
    ],
    correct: 'b',
    brief: 'First groove ectoderm laterally, mesenchyme in the middle, first pouch endoderm medially.',
    detailed: 'The Handbook: the drum forms as the ectoderm of the first pharyngeal groove medializes, thins the first-arch mesenchyme (the fibrous middle layer), and abuts the endoderm of the first pouch. Glasscock: the tympanic ring forms from four ossification centres at 9 weeks and fuses by the tenth week except superiorly, leaving the notch of Rivinus.\nApplication: the notch of Rivinus explains why the flaccida has no annulus.',
    concepts: ['tm-dev'],
},

// ════════ TYMPANIC CAVITY ════════
{
    id: 'q30', section: 'Tympanic Cavity',
    stem: 'Where is the tympanic cavity narrowest from lateral to medial?',
    options: [
        { id: 'a', text: 'In the attic' },
        { id: 'b', text: 'In the hypotympanum' },
        { id: 'c', text: 'Between the umbo and the promontory' },
        { id: 'd', text: 'At the aditus' },
    ],
    correct: 'c',
    brief: 'About 2 mm between umbo and promontory, against about 6 mm in the attic and 4 mm in the hypotympanum.',
    detailed: 'Mechanism: the drum is cone-shaped toward the medial wall, and the promontory bulges laterally, so the two surfaces nearly meet at the umbo. Height and anteroposterior length are each about 15 mm.\nApplication: a retracted drum touches the promontory first, which is where adhesive otitis begins.\nCaveat: the widths are standard (Gray\'s) teaching cited secondhand; the ranked otology texts do not give them.',
    concepts: ['cav-box'],
},
{
    id: 'q31', type: 'recall', section: 'Tympanic Cavity',
    stem: 'Name the six walls of the tympanic cavity and the main structure beyond each.',
    answer: `• Lateral: tympanic membrane and scutum; beyond, the external canal
• Medial: promontory and labyrinthine wall; beyond, cochlea and vestibule
• Roof: tegmen tympani; beyond, middle fossa dura
• Floor: thin plate over the jugular bulb
• Anterior: Eustachian tube orifice and carotid canal; beyond, the internal carotid artery
• Posterior: aditus, pyramid, facial recess and sinus tympani; beyond, the mastoid and the mastoid facial nerve`,
    brief: 'A box with dura above, jugular below, carotid in front, mastoid behind, labyrinth medially.',
    detailed: 'The Handbook gives the boundaries as lateral TM, superior tegmen, inferior jugular bulb, anterior carotid canal and Eustachian tube, posterior mastoid via the facial recess or retrofacial cells, medial promontory and labyrinthine wall.',
    concepts: ['cav-box'],
},
{
    id: 'q32', section: 'Tympanic Cavity',
    stem: 'Where does the chorda tympani leave the tympanic cavity?',
    options: [
        { id: 'a', text: 'Through the canal of Huguier, beside the petrotympanic fissure' },
        { id: 'b', text: 'Through the iter chordae posterius' },
        { id: 'c', text: 'Through the facial hiatus' },
        { id: 'd', text: 'Through the stylomastoid foramen' },
    ],
    correct: 'a',
    brief: 'In through the iter chordae posterius (posterior wall, chordal eminence); out through the canal of Huguier (anterior, at the petrotympanic fissure).',
    detailed: 'Glasscock: the chordal eminence, lateral to the pyramidal eminence, houses the iter chordae posterius by which the chorda enters. It then crosses the lateral wall medial to the drum, between incus and malleus, and leaves anteriorly through the petrotympanic fissure region.\nApplication: the chorda sits just under the posterosuperior annulus, where it is first met in raising a tympanomeatal flap.',
    concepts: ['cav-lateral', 'cav-posterior'],
},
{
    id: 'q33', section: 'Tympanic Cavity',
    stem: 'In the middle ear, which landmark marks the anterior end of the tympanic facial nerve, with the nerve running immediately above it?',
    options: [
        { id: 'a', text: 'Pyramidal eminence' },
        { id: 'b', text: 'Ponticulus' },
        { id: 'c', text: 'Cochleariform process' },
        { id: 'd', text: 'Subiculum' },
    ],
    correct: 'c',
    brief: 'The tensor tendon turns 90° at the cochleariform process; the tympanic facial nerve runs immediately superior to it, with the geniculate ganglion just anterosuperior.',
    detailed: 'Glasscock: the cochleariform process is a landmark to the anterior aspect of the tympanic segment, which runs immediately superior to it. Cummings Review: the nerve enters the middle ear just posterior and superior to the cochleariform process and runs over the superior border of the oval window.\nApplication: the nerve is dehiscent over the oval window in 25–55% of temporal bones (Cummings Review), and the geniculate ganglion in 10–20%.\nPearl: the cochleariform process is constant even when the ossicles are eroded.',
    concepts: ['cav-medial'],
},
{
    id: 'q34', section: 'Tympanic Cavity',
    stem: 'The sinus tympani is bounded superiorly and inferiorly by which two ridges?',
    options: [
        { id: 'a', text: 'Ponticulus above, subiculum below' },
        { id: 'b', text: 'Subiculum above, ponticulus below' },
        { id: 'c', text: 'Chordal eminence above, styloid eminence below' },
        { id: 'd', text: 'Cochleariform process above, finiculus below' },
    ],
    correct: 'a',
    brief: 'Ponticulus superiorly (toward the oval window), subiculum inferiorly (toward the round window); mastoid facial nerve laterally, posterior canal medially.',
    detailed: 'Glasscock: the sinus tympani is defined by the ponticulus superiorly, the subiculum inferiorly, the mastoid facial nerve laterally and the posterior semicircular canal medially, with variable posterior extension; it evades direct surgical view and can harbour residual cholesteatoma. Cummings Review: medial to the descending facial nerve, posterior to the oval window (separated by the ponticulus) and round window niche (separated by the subiculum).\nApplication: an angled endoscope reaches it; the microscope through the canal or the facial recess does not.',
    concepts: ['cav-medial', 'cav-posterior'],
},
{
    id: 'q35', section: 'Tympanic Cavity',
    stem: 'A round window that looks as if it has a defect at exploration most often shows which normal finding?',
    options: [
        { id: 'a', text: 'A dehiscent jugular bulb behind it' },
        { id: 'b', text: 'A mucosal veil in front of the true membrane, often perforated' },
        { id: 'c', text: 'A persistent stapedial artery' },
        { id: 'd', text: 'The finiculus' },
    ],
    correct: 'b',
    brief: 'The true round window membrane is usually hidden by a mucosal veil, which is often perforated and mimics a defect.',
    detailed: 'Glasscock: in the vast majority of cases the true round window membrane is obscured by a mucosal veil; most often the veil is perforated, giving the false impression of a defect in the membrane.\nApplication: inspect deep to the niche lip before calling a perilymph fistula.',
    concepts: ['cav-medial'],
},
{
    id: 'q36', section: 'Tympanic Cavity',
    stem: 'Which nerve enters the middle ear through the inferior tympanic canaliculus, and what does it become?',
    options: [
        { id: 'a', text: 'Arnold nerve; the auricular branch of the vagus' },
        { id: 'b', text: 'Chorda tympani; the lingual nerve' },
        { id: 'c', text: 'Nerve to stapedius; the pyramidal branch' },
        { id: 'd', text: 'Jacobson nerve (IX); the tympanic plexus, then the lesser petrosal nerve to the otic ganglion' },
    ],
    correct: 'd',
    brief: 'Jacobson nerve and the inferior tympanic artery pass the canaliculus in the crest between carotid and jugular; on the promontory the plexus gives the lesser petrosal nerve.',
    detailed: 'Glasscock: the aperture of the inferior tympanic canaliculus, traversed by the inferior tympanic artery and Jacobson nerve, lies in the jugulocarotid crest. The lesser petrosal nerve, with the superior tympanic artery, runs in the superior tympanic canaliculus lateral to and parallel with the greater petrosal nerve.\nApplication: parasympathetic fibres reach the parotid through the otic ganglion and auriculotemporal nerve.',
    concepts: ['cav-roof-floor', 'cav-medial'],
},
{
    id: 'q37', section: 'Tympanic Cavity',
    stem: 'Why is the hypotympanic floor prone to leaving the jugular bulb bare in the middle ear?',
    options: [
        { id: 'a', text: 'It is formed from three bone types (tympanic, otic capsule, petrosal ledge) late in fetal life' },
        { id: 'b', text: 'It is the thinnest part of the otic capsule' },
        { id: 'c', text: 'It is resorbed by the stapedius muscle' },
        { id: 'd', text: 'It forms from the first pharyngeal pouch' },
    ],
    correct: 'a',
    brief: 'The hypotympanum develops between 22 and 32 weeks from tympanic bone, canalicular otic capsule and a petrosal ledge; the seams can fail.',
    detailed: 'Glasscock describes the floor as a tripartite bony amalgam and says this variegated origin predisposes it to anomalous development, such as a bare jugular bulb.\nApplication: a blue mass behind the posteroinferior quadrant is a jugular bulb until proven otherwise; do not biopsy it.\nCaveat: definitions of a high bulb vary between sources.',
    concepts: ['cav-roof-floor'],
},
{
    id: 'q38', section: 'Tympanic Cavity',
    stem: 'On the anterior wall of the tympanic cavity, what lies immediately below the bulge of the tensor tympani semicanal?',
    options: [
        { id: 'a', text: 'The tympanic orifice of the Eustachian tube' },
        { id: 'b', text: 'The cochleariform process' },
        { id: 'c', text: 'The pyramidal eminence' },
        { id: 'd', text: 'The aditus' },
    ],
    correct: 'a',
    brief: 'Top to bottom on the anterior wall: tensor semicanal, Eustachian tube orifice, carotid wall.',
    detailed: 'Glasscock: anteriorly the mesotympanum is dominated by the bulge of the tensor semicanal, with the tympanic orifice of the Eustachian tube immediately inferior. The orifice sits a few millimetres above the floor. Cummings Review shows the caroticotympanic canaliculus in the carotid wall below.\nApplication: the internal carotid artery lies just anteromedial to the protympanum; an aberrant carotid appears as a mass behind the anteroinferior drum.',
    concepts: ['cav-anterior'],
},
{
    id: 'q39', section: 'Tympanic Cavity',
    stem: 'During dissection in the supratubal recess, which structure on its medial wall is at risk?',
    options: [
        { id: 'a', text: 'The jugular bulb' },
        { id: 'b', text: 'The geniculate ganglion of the facial nerve' },
        { id: 'c', text: 'The round window membrane' },
        { id: 'd', text: 'The endolymphatic sac' },
    ],
    correct: 'b',
    brief: 'The supratubal recess lies above the tensor fold, bounded behind by the cog and cochleariform process; the geniculate ganglion sits in its medial wall.',
    detailed: 'Cummings Review: the medial wall of the supratubal recess houses the geniculate ganglion, which may be dehiscent from cholesteatoma; its posterior boundary is the cochleariform process below and the cog above. The recess is part of the epitympanum, above the tensor fold.',
    concepts: ['cav-anterior'],
},
{
    id: 'q40', section: 'Tympanic Cavity',
    stem: 'Name the boundaries of the facial recess.',
    options: [
        { id: 'a', text: 'Sinus tympani medially, round window inferiorly, promontory anteriorly' },
        { id: 'b', text: 'Tegmen superiorly, sigmoid sinus posteriorly, digastric ridge inferiorly' },
        { id: 'c', text: 'Mastoid facial nerve medially, chorda tympani laterally, incus buttress superiorly' },
        { id: 'd', text: 'Ponticulus superiorly, subiculum inferiorly' },
    ],
    correct: 'c',
    brief: 'The facial recess is lateral to the descending facial nerve and medial to the chorda, which is itself medial to the annulus, capped by the incus buttress.',
    detailed: 'Cummings Review: the facial recess is lateral to the vertical facial nerve but medial to the chorda, which is medial to the annulus. Option d describes the sinus tympani; option b, a mastoid cavity.\nApplication: opening the recess (posterior tympanotomy) shows the incudostapedial joint, stapes, pyramid and round window niche.',
    concepts: ['cav-posterior'],
},

// ════════ OSSICLES ════════
{
    id: 'q41', type: 'recall', section: 'Ossicular Chain',
    stem: 'Name the parts of each ossicle.',
    answer: `• Malleus: head, neck, lateral process, anterior process, manubrium
• Incus: body, short process, long process, lenticular process
• Stapes: head (capitulum), neck, anterior and posterior crura, footplate; the obturator foramen between the crura`,
    brief: 'Malleus five parts, incus four, stapes five.',
    detailed: 'By length, the malleus is the longest ossicle and the stapes the smallest; the stapes is also the most medial. Glasscock: the anterior crus is thinner and straighter than the posterior.\nApplication: the lenticular process articulates with the stapes head; the long process is the segment that erodes in chronic otitis media.',
    concepts: ['os-parts'],
},
{
    id: 'q42', section: 'Ossicular Chain',
    stem: 'About how large is the adult stapes footplate?',
    options: [
        { id: 'a', text: 'About 1 × 0.5 mm' },
        { id: 'b', text: 'About 2.7–2.9 mm long and 1.2–1.5 mm wide' },
        { id: 'c', text: 'About 5 × 3 mm' },
        { id: 'd', text: 'About 9 × 8 mm' },
    ],
    correct: 'b',
    brief: 'Roughly 3 × 1.4 mm; series give means of 2.7–2.9 mm by 1.2–1.5 mm.',
    detailed: 'Morphometry: Folia Morphologica 2024 gives 2.93 × 1.46 mm; a micro-CT series 2.71 × 1.23 mm; a cadaveric series of 60 stapes 2.78 × 1.34 mm. Method (dry bone, micro-CT, CT) changes the numbers.\nApplication: the footplate is a long, narrow oval, with its long axis anteroposterior.\nDiscrepancy: the plan draft gave 3 × 1.4 mm, at the high end of measured length.',
    concepts: ['os-parts'],
},
{
    id: 'q43', section: 'Ossicular Chain',
    stem: 'The ossicular axis of rotation runs between which two ligaments?',
    options: [
        { id: 'a', text: 'Superior malleal and superior incudal' },
        { id: 'b', text: 'Lateral malleal and annular' },
        { id: 'c', text: 'Anterior malleal and posterior incudal' },
        { id: 'd', text: 'Tensor tendon and stapedius tendon' },
    ],
    correct: 'c',
    brief: 'From the anterior malleal ligament (through the petrotympanic fissure) to the posterior incudal ligament (fossa incudis).',
    detailed: 'Glasscock: the anterior malleal ligament, extending from the anterior process through the petrotympanic fissure, with the posterior incudal ligament anchoring the short process in the fossa incudis, creates the axis of rotation. The manubrium is about 1.3 times the length of the incus long process, the ossicular lever.\nApplication: the chain rocks about this axis; fixation at either end (anterior malleal ligament, incus in the attic) stiffens it.',
    concepts: ['os-joints'],
},
{
    id: 'q44', section: 'Ossicular Chain',
    stem: 'When dissecting disease off the stapes superstructure, in which direction should instruments move, and why?',
    options: [
        { id: 'a', text: 'Anterior to posterior, against the tensor tendon' },
        { id: 'b', text: 'Superior to inferior, along the facial nerve' },
        { id: 'c', text: 'Lateral to medial, toward the vestibule' },
        { id: 'd', text: 'Posterior to anterior, parallel to the stapedius tendon, so the tendon resists displacement' },
    ],
    correct: 'd',
    brief: 'Dissect parallel to the stapedius tendon, posterior to anterior; the tendon then holds the stapes against the pull.',
    detailed: 'Glasscock: ligaments and tendons hold the ossicles, but injudicious manipulation easily overcomes them; dissect parallel to the plane of the stapedius tendon in a posterior to anterior direction so the tendon resists displacement of the stapes.\nApplication: the incudomallear and incudostapedial joints are synovial (Handbook), so they subluxate rather than fracture.',
    concepts: ['os-joints', 'os-stapedius'],
},
{
    id: 'q45', section: 'Ossicular Chain',
    stem: 'A chronic large perforation shows a manubrium pulled medially onto the promontory. Which muscle does this, and what is its nerve?',
    options: [
        { id: 'a', text: 'Tensor tympani; V3' },
        { id: 'b', text: 'Stapedius; facial nerve' },
        { id: 'c', text: 'Tensor veli palatini; V3' },
        { id: 'd', text: 'Levator veli palatini; vagus' },
    ],
    correct: 'a',
    brief: 'The tensor tympani pulls the malleus medially; with no drum to oppose it the manubrium medializes.',
    detailed: 'Glasscock: the tensor arises from its semicanal, the greater wing of the sphenoid and the Eustachian tube cartilage; its tendon sweeps around the cochleariform process to the medial neck and manubrium. The intact drum normally opposes its pull; with a large perforation the manubrium can medialize, and the tendon may need lateralization or section for grafting.\nApplication: first-arch muscle, V3 nerve, as the tensor veli palatini.',
    concepts: ['os-tensor'],
},
{
    id: 'q46', type: 'recall', section: 'Ossicular Chain',
    stem: 'Give the stapedius muscle\'s location, insertion, nerve and arch.',
    answer: `• Location: in a vertical sulcus in the posterior wall beside the mastoid facial nerve; its tendon exits the pyramidal eminence
• Insertion: posterior stapes (neck, head or posterior crus by source)
• Nerve: facial nerve (nerve to stapedius)
• Arch: second
• Action: pulls the stapes posteriorly, stiffening the chain`,
    brief: 'Second-arch muscle, facial nerve, out of the pyramid onto the posterior stapes.',
    detailed: 'Discrepancy: Cummings Review gives the insertion as the stapes neck; Glasscock as the posterior crus and occasionally the head; the Handbook as the posterior capitulum or posterior crus.',
    concepts: ['os-stapedius'],
},
{
    id: 'q47', section: 'Ossicular Chain',
    stem: 'A right facial nerve lesion lies proximal to the nerve to stapedius. Sound to the right ear: what happens to the acoustic reflex recorded in the right ear and in the left?',
    options: [
        { id: 'a', text: 'Both reflexes absent' },
        { id: 'b', text: 'Right absent, left present' },
        { id: 'c', text: 'Right present, left absent' },
        { id: 'd', text: 'Both present' },
    ],
    correct: 'b',
    brief: 'The afferent path (right VIII) and the bilateral brainstem relay are intact; only the right efferent (VII) fails, so the reflex is lost wherever it is recorded in the right ear.',
    detailed: 'Arc: VIII → ventral cochlear nucleus → superior olivary complex on both sides → facial motor nuclei on both sides → stapedius. A unilateral efferent lesion abolishes the reflex in that ear for stimulation of either ear and spares the other ear.\nApplication: an absent reflex in one ear for both stimulated sides points to the efferent limb (VII) or that ear\'s middle ear, not to VIII.',
    concepts: ['os-stapedius'],
},
{
    id: 'q48', section: 'Ossicular Chain',
    stem: 'Which ossicular segment is most prone to erosion in chronic otitis media, and why?',
    options: [
        { id: 'a', text: 'Malleus head, because it sits in the attic' },
        { id: 'b', text: 'Stapes footplate, because it is thinnest' },
        { id: 'c', text: 'Incus long and lenticular process, because its blood supply is a single mucosal source without collaterals' },
        { id: 'd', text: 'Manubrium, because it is covered only by drum' },
    ],
    correct: 'c',
    brief: 'The long process hangs free in the mesotympanum on a tenuous mucosal supply; inflammation resorbs it first.',
    detailed: 'Cummings Review: the long process of the incus has a single blood supply without collaterals, predisposing it to erosion. Glasscock: perhaps owing to its tenuous supply, it is particularly prone to osteitic resorption in chronic otitis media. The stapes receives anterior and posterior crural branches.\nApplication: an eroded long process gives an incudostapedial discontinuity with an intact stapes.\nVariant: a persistent stapedial artery runs through the obturator foramen.',
    concepts: ['os-supply'],
},
{
    id: 'q49', section: 'Ossicular Chain',
    stem: 'By the board rule, which ossicular parts come from the second arch (Reichert cartilage)?',
    options: [
        { id: 'a', text: 'Malleus head and neck, incus body and short process' },
        { id: 'b', text: 'Manubrium, incus long process, stapes superstructure' },
        { id: 'c', text: 'Stapes footplate and annular ligament' },
        { id: 'd', text: 'All three ossicles entirely' },
    ],
    correct: 'b',
    brief: 'What you see through the drum is second arch; what lies above it in the attic is first arch; the footplate is otic capsule.',
    detailed: 'The Handbook: Meckel (first arch) forms the head and neck of the malleus and the body and short process of the incus; Reichert (second arch) forms the manubrium, the long process of the incus and the stapes suprastructure; the footplate is of otic capsule origin; the manubrium never completely ossifies.\nApplication: the same split explains tensor (first arch, V3) versus stapedius (second arch, VII).\nCaveat: lineage studies, largely in mice, assign shares differently; the guide\'s appraisal chapter covers this.',
    concepts: ['os-dev'],
},
{
    id: 'q50', type: 'recall', section: 'Ossicular Chain',
    stem: 'Name the ligaments that suspend the ossicular chain and where each anchors.',
    answer: `• Superior malleal: malleus head to the tegmen
• Anterior malleal: anterior process to the petrotympanic fissure
• Lateral malleal: malleus neck to the notch of Rivinus (roof of Prussak space)
• Superior incudal: incus body to the tegmen
• Posterior incudal: short process to the fossa incudis
• Annular (stapediovestibular): footplate to the oval window margin`,
    brief: 'Two to the roof, one forward, one lateral, one back, one round the footplate.',
    detailed: 'Prussak space: lateral boundary the pars flaccida; medial boundary the malleus neck; roof the lateral malleal ligament; floor the lateral process of the malleus. Glasscock also names the anterior and posterior malleal folds as bounding it.',
    concepts: ['os-joints'],
},
];

window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };
