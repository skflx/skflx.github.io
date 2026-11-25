/* =============================================================
   Cholesteatoma: congenital vs acquired, pathogenesis, staging, and imaging
   OKSAT · Interactive learning · cholesteatoma · chapter 2
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'cholesteatoma-dx',
    title: 'Cholesteatoma: congenital vs acquired, pathogenesis, staging, and imaging',
    kicker: '2 · Cholesteatoma & imaging',
    review: 'draft',
    lede: 'Congenital criteria and staging, why pediatric acquired cholesteatoma behaves differently from adult disease, the embryologic folds that steer growth, and when to order CT versus non-EPI DWI MRI.',
    src: 'C2 · P16 · J8 · K16 · E35 · E43 · E46–E48 · E52 · E56',
    tldr: [
        'Congenital cholesteatoma (2–7%) is an epidermoid cyst behind an intact TM with no prior otorrhea, perforation, or ear surgery (prior AOM does not exclude it); the board-keyed site is anterosuperior, and early-stage recurrence is 0–13% vs up to two-thirds in advanced disease.',
        'Acquired cholesteatoma arises from RPs (pars flaccida in adults, but **2× more often pars tensa in children**, causing early incus/stapes erosion) or migration through marginal perforations, driven by elevated Ki-67/MIB-1, reduced apoptosis, and MMPs.',
        'Growth follows embryologic mucosal folds: posterior epitympanic spreads **lateral** to the ossicles, while posterior mesotympanic penetrates toward the mastoid **medial** to the ossicles.',
        'Diagnosis is clinical; noncontrast temporal bone CT is for surgical planning and red-flag complications, while non-EPI DWI (HASTE) MRI detects residual/recurrent keratin as bright restricted diffusion and reduces second-look surgery.',
    ],
    sections: [
        {
            id: 'congenital-cholesteatoma',
            ref: ['Otology/Congenital cholesteatoma presents as an anterosuperior white mass behind an intact tympanic membrane'],
            n: '2.1',
            title: 'Congenital cholesteatoma: definition, site, and staging',
            blocks: [
                { t: 'p', x: 'Cholesteatoma is an epidermal inclusion cyst in the middle ear with a stratified squamous epithelium matrix and concentrically accumulating keratin. **Congenital cholesteatoma** accounts for **2–7%** of all cholesteatomas and is defined as an epidermoid cyst behind an intact TM with no history of otorrhea, perforation, or prior ear surgery—**prior AOM does not exclude it**. **Michaels structure** is a fetal epidermoid structure present at **10–33 weeks of gestation** in the anterosuperior tympanum whose persistence is hypothesized to cause congenital cholesteatoma. [[src|E46]] [[src|E56]]' },
                { t: 'p', x: 'Classically, congenital cholesteatoma arises from an ectopic squamous cell nest on the promontory / **anterosuperior quadrant** anterior to the malleus. In **Potsic and Nelson staging**, early-stage congenital cholesteatoma recurs in **0–13%**, whereas advanced disease recurs up to **two-thirds** of the time. Detected in the first few years of life, it remains confined to the protympanum and can be removed in toto in a **single stage** via extended tympanotomy preserving the TM and ossicles; older children show ossicular or epitympanic spread requiring staged CWU. Even in congenital cholesteatoma, pediatric patients have **smaller mastoid volume** (underdeveloped pneumatization) than normal controls. [[src|J8]] [[src|K16]] [[src|E56]] [[src|P16]]' },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'Classic site of congenital cholesteatoma is keyed to the board answer: **anterosuperior quadrant / promontory anterior to the malleus**, matching Michaels structure. Sanna series reported posterior mesotympanum predominance (Type A 52.27%, Type B 6.83%, Type A/B 40.90%; 46.72% retromalleolar vs 5.55% premalleolar); treat this as a series caveat, never the keyed board answer. [[src|J8]] [[src|K16]] [[src|E56]]' },
                    ],
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/congenital-cholesteatoma.png',
                    alt: 'Illustration of a congenital cholesteatoma arising on the promontory anterior to the malleus behind an intact tympanic membrane.',
                    cap: 'Congenital cholesteatoma on the promontory anterior to the malleus behind an intact TM. Jackler, Ear Surgery Illustrated (Thieme, 2019), Fig. 8.128.',
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/potsic-staging.svg',
                    alt: 'Four-panel schematic of Potsic staging for congenital cholesteatoma in a right tympanic membrane: Stage I single anterosuperior quadrant, Stage II multiple quadrants without ossicular or mastoid involvement, Stage III ossicular involvement without mastoid involvement, and Stage IV mastoid involvement.',
                    cap: 'Potsic staging of congenital cholesteatoma (Stages I–IV); early stages recur 0–13% vs up to two-thirds in advanced disease. Schematic (OKSAT)',
                },
                { t: 'check', id: 'c1', q: 'Does a history of two prior episodes of acute otitis media exclude congenital cholesteatoma?', a: 'No; criteria exclude prior otorrhea, TM perforation, or ear surgery, but prior AOM does not exclude congenital cholesteatoma.' },
                { t: 'check', id: 'c2', q: 'What is Michaels structure, when is it present in gestation, and how does Potsic-Nelson stage change recurrence risk?', a: 'A fetal epidermoid rest in the anterosuperior tympanum at 10–33 weeks of gestation; early-stage disease recurs in 0–13% vs up to two-thirds in advanced disease.' },
                { t: 'practice', title: 'Apply it', refs: ['pediatrics:q14', 'cholesteatoma:q12', 'cholesteatoma:q13'] },
            ],
            drill: [{ m: 'cholesteatoma', c: ['congenital-cholesteatoma'] }],
        },
        {
            id: 'acquired-pathogenesis',
            ref: [
                'Otology/Primary acquired cholesteatoma arises from retraction pocket invagination of the pars flaccida into Prussak space',
                'Otology/Secondary acquired cholesteatoma develops from squamous epithelial migration through a tympanic membrane perforation',
                'Otology/The epitympanic diaphragm and tympanic isthmus govern attic ventilation and selective epitympanic dysventilation',
            ],
            n: '2.2',
            title: 'Acquired cholesteatoma: pathogenesis, biology, and pediatric vs adult behavior',
            blocks: [
                { t: 'p', x: 'Acquired cholesteatoma most commonly begins as a retraction pocket, most often in the **pars flaccida** in adults. Primary acquired cholesteatoma is strongly associated with mastoid hypopneumatization, purulent discharge, and a tendency to be bilateral. **Secondary acquired** cholesteatoma arises via marginal perforations (lacking the fibrous annulus, "unsafe") allowing EAC skin to migrate into the middle ear. Other theories include **basal cell hyperplasia** (a basement membrane defect allowing epithelial ingrowth) and **epithelial migration without contact inhibition**. [[src|J8]] [[src|E35]] [[src|C2]]' },
                { t: 'p', x: 'Biologically, cholesteatoma matrix exhibits increased basal keratinocyte proliferation (elevated **Ki-67** and **MIB-1**), **decreased apoptosis**, and elevated **MMPs** driving bone erosion. In children, acquired cholesteatoma is much more common than congenital (even 3- to 4-year-olds can present with extensive disease and bone erosion), and it is **twice as likely to originate from the pars tensa as from the pars flaccida**, causing early incus and stapes erosion. Underdeveloped mastoid pneumatization (smaller mastoid volume) is an almost invariable finding in both acquired and congenital pediatric cholesteatoma. [[src|K16]] [[src|P16]]' },
                {
                    t: 'table',
                    head: ['Feature', 'Pediatric', 'Adult'],
                    rows: [
                        ['Dominant acquired origin', 'Pars tensa 2× more likely than pars flaccida → early incus and stapes erosion [[src|P16]]', 'Pars flaccida / posterior epitympanum most common [[src|J8]]'],
                        ['Congenital vs acquired', 'Acquired much more common; 3–4-year-olds can have extensive bone erosion [[src|P16]]', 'Overwhelmingly acquired [[src|P16]]'],
                        ['Mastoid pneumatization', 'Underdeveloped / smaller mastoid volume is the norm in both congenital and acquired [[src|P16]]', 'Strong association with mastoid hypopneumatization [[src|J8]]'],
                        ['Congenital stage at diagnosis', 'First few years: protympanic, single-stage; older child: ossicular/epitympanic spread [[src|J8]]', 'Rarely first diagnosed in adulthood [[src|J8]]'],
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'Pediatric mastoid pneumatization is keyed to **Cummings Pediatric Ch. 16**, which reports underdeveloped mastoid pneumatization (smaller mastoid volume) as the norm in both acquired and congenital pediatric cholesteatoma. Sanna states children have "highly cellular" / "usually very pneumatized" mastoids as a rationale for CWU; Cummings Pediatric refutes this and favors pediatric CWU instead for cavity intolerance and cortical bone regrowth. [[src|P16]] [[src|E47]] [[src|E48]]' },
                    ],
                },
                {
                    t: 'figure',
                    src: 'images/oksat/ear-anatomy/coronal-attic.svg',
                    alt: 'Coronal schematic of a right attic showing Prussak space bounded by the pars flaccida, lateral malleal fold, and scutum.',
                    cap: 'Schematic of Prussak space bounded by the pars flaccida, lateral malleal fold, and scutum.',
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/acquired-retraction-pathogenesis.jpg',
                    alt: 'Schematic progression of negative middle ear pressure drawing the pars flaccida into a keratin-accumulating retraction pocket.',
                    cap: 'Progression of negative middle ear pressure drawing the pars flaccida into a cholesteatoma. Kirtane, de Souza & Sanna, Otology and Neurotology (Thieme, 2013), Fig. 16.1.',
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/stam-sites.svg',
                    alt: 'Lateral schematic of a right middle ear cleft showing the five EAONO/JOS STAM regions: attic (A), tympanic cavity (T), mastoid (M), supratubal recess (S1), and sinus tympani (S2), with Stage I through IV definitions.',
                    cap: 'Middle ear cleft site map and staging (Added — verify: EAONO/JOS 2017; not in the guide\'s sources). Schematic (OKSAT)',
                },
                { t: 'check', id: 'c1', q: 'How does the most common site of origin of acquired cholesteatoma differ between children and adults, and what ossicular consequence follows in children?', a: 'In children, acquired cholesteatoma is twice as likely to arise from the pars tensa as from the pars flaccida, leading to early incus and stapes erosion; in adults it most often starts in the pars flaccida.' },
                { t: 'check', id: 'c2', q: 'Name the three cellular/molecular hallmarks of cholesteatoma matrix that explain its aggressive bone resorption.', a: 'Increased basal keratinocyte proliferation (elevated Ki-67 and MIB-1), decreased apoptosis, and elevated matrix metalloproteinases (MMPs).' },
                { t: 'check', id: 'c3', q: 'Besides retraction pockets and epithelial migration through marginal perforations, what other mechanism explains acquired cholesteatoma behind a localized defect?', a: 'Basal cell hyperplasia through a basement membrane defect (and epithelial migration without contact inhibition).' },
                { t: 'practice', title: 'Apply it', refs: ['cholesteatoma:q14', 'cholesteatoma:q15', 'ear-anatomy:q59'] },
            ],
            drill: [{ m: 'cholesteatoma', c: ['acquired-pathogenesis'] }],
        },
        {
            id: 'growth-pathways',
            ref: [
                'Otology/The retrotympanum is partitioned into sinus tympani, facial sinus, and subtympanic sinus by the ponticulus and subiculum',
                'Otology/Transcanal endoscopic ear surgery TEES provides line-of-sight visualization into the sinus tympani and epitympanum',
            ],
            n: '2.3',
            title: 'Growth pathways and middle ear surgical landmarks',
            blocks: [
                { t: 'p', x: 'Cholesteatoma growth is constrained by middle ear ligaments and mesenteries derived from embryological remnants of the first pharyngeal pouch. The **notch of Rivinus** is the bony gateway to the epitympanum bordered by the anterior and posterior tympanic spines. The **cog** is a bony septum suspended from the tegmen tympani separating the anterior from the posterior epitympanum. Fetid otorrhea and hearing loss are the primary presenting complaints, and a **30-degree rigid endoscope** visualizes epitympanic retraction pocket extent missed by the microscope. [[src|J8]] [[src|C2]] [[src|E46]] [[src|E48]]' },
                {
                    t: 'table',
                    head: ['Growth route (frequency)', 'Pathway relative to ossicles', 'Key anatomical neighbors'],
                    rows: [
                        ['Posterior epitympanic (1st)', 'Lateral to the ossicles into epitympanum and posterior mesotympanum [[src|J8]]', 'Prussak space, scutum, notch of Rivinus [[src|C2]]'],
                        ['Posterior mesotympanic (2nd)', 'Medial to the ossicles toward the mastoid [[src|J8]]', 'Sinus tympani (medial to descending facial nerve; hidden disease) [[src|C2]]'],
                        ['Anterior epitympanic (3rd)', 'Anterior to the cog into the supratubal recess [[src|J8]] [[src|C2]]', 'Geniculate ganglion on medial wall (may be dehiscent) [[src|C2]]'],
                    ],
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'The cholesteatoma hearer',
                    blocks: [
                        { t: 'p', x: 'Patients with ossicular erosion from cholesteatoma may perceive **no preoperative hearing loss** because the cholesteatoma mass transmits sound across the defect. Counsel patients that hearing may worsen immediately after disease removal. [[src|K16]]' },
                    ],
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/cholesteatoma-origins.png',
                    alt: 'Illustration ranking acquired cholesteatoma origin sites: posterior epitympanum first, posterior mesotympanum second, and anterior epitympanum third.',
                    cap: 'Acquired cholesteatoma origin sites ranked by frequency. Jackler, Ear Surgery Illustrated (Thieme, 2019), Fig. 8.9.',
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/posterior-epitympanic-route.png',
                    alt: 'Illustration showing posterior epitympanic cholesteatoma extending into the attic and posterior mesotympanum lateral to the ossicular chain.',
                    cap: 'Posterior epitympanic cholesteatoma tracking lateral to the ossicles. Jackler, Ear Surgery Illustrated (Thieme, 2019), Fig. 8.12.',
                },
                { t: 'check', id: 'c1', q: 'Contrast how posterior epitympanic and posterior mesotympanic cholesteatomas pass relative to the ossicular chain.', a: 'Posterior epitympanic penetrates lateral to the ossicles; posterior mesotympanic penetrates toward the mastoid medial to the ossicles.' },
                { t: 'check', id: 'c2', q: 'What structure is the cog, and what neural structure lies on the medial wall of the anterior epitympanum (supratubal recess) beyond it?', a: 'A bony septum suspended from the tegmen tympani dividing anterior and posterior epitympanum; the geniculate ganglion, which may be dehiscent.' },
                { t: 'check', id: 'c3', q: 'Why can a patient with complete incus erosion from cholesteatoma have minimal preoperative hearing loss?', a: 'The cholesteatoma mass transmits sound vibrations across the ossicular defect.' },
                { t: 'practice', title: 'Apply it', refs: ['cholesteatoma:q16', 'cholesteatoma:q17', 'ear-anatomy:q61'] },
            ],
            drill: [{ m: 'cholesteatoma', c: ['growth-pathways'] }],
        },
        {
            id: 'cholesteatoma-imaging',
            ref: [
                'Otology/Non-echo-planar diffusion-weighted MRI detects recurrent and residual cholesteatoma as small as two millimeters',
                'Otology/Petrous apex lesions are differentiated into cholesterol granuloma, cholesteatoma, and mucocele by T1, T2, and non-EPI diffusion-weighted MRI',
            ],
            n: '2.4',
            title: 'Imaging: CT for surgical planning and non-EPI DWI MRI',
            blocks: [
                { t: 'p', x: 'Cholesteatoma is diagnosed on **physical exam**; routine CT or MRI is not required to make the diagnosis. High-resolution noncontrast axial and coronal temporal bone CT is critical for surgical planning and mandatory when red-flag symptoms occur: **headache, vertigo, facial nerve paralysis, severe SNHL, or sudden deafness**. When **intracranial complications** are suspected, **contrast-enhanced imaging and MRI** are required in addition to noncontrast temporal bone CT. Tympanosclerosis mimics cholesteatoma on CT with soft-tissue density, but unlike attic cholesteatoma, **tympanosclerosis does not erode the scutum**. [[src|E52]] [[src|K16]] [[src|C2]] [[src|E43]]' },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'Diagnosis is **clinical** (otomicroscopy), and high-resolution noncontrast temporal bone CT is obtained for **surgical planning and suspected complications**, consistent with Cummings Review naming temporal bone CT as the imaging study of choice (with MRI for complicated disease) when imaging is needed. [[src|E52]] [[src|K16]] [[src|C2]]' },
                    ],
                },
                {
                    t: 'table',
                    head: ['Modality', 'Key findings / indications'],
                    rows: [
                        ['Noncontrast HRCT temporal bone', 'Surgical planning and red-flag symptoms (headache, vertigo, CN VII palsy, severe/sudden SNHL); attic cholesteatoma erodes the scutum whereas tympanosclerosis does not [[src|E52]] [[src|E43]]'],
                        ['Contrast CT + MRI', 'Required whenever intracranial complications are suspected [[src|E52]]'],
                        ['Non-EPI DWI (HASTE) MRI', 'Identifies cholesteatoma as a bright hyperintense lesion from restricted water diffusion; reduces the need for second-stage CWU surgery [[src|K16]] [[src|P16]]'],
                    ],
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/ct-attic-cholesteatoma.jpg',
                    alt: 'Coronal temporal bone CT of a right ear showing an attic cholesteatoma confined to Prussak space with lateral attic involvement.',
                    cap: 'Coronal temporal bone CT showing attic cholesteatoma in Prussak space. Kirtane, de Souza & Sanna, Otology and Neurotology (Thieme, 2013), Fig. 16.2.',
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/mri-haste-cholesteatoma.jpg',
                    alt: 'Non-EPI HASTE diffusion-weighted MRI demonstrating a bright hyperintense recurrent cholesteatoma within the mastoid cavity.',
                    cap: 'Non-EPI HASTE DWI showing bright hyperintense recurrent cholesteatoma. Kirtane, de Souza & Sanna, Otology and Neurotology (Thieme, 2013), Fig. 16.4.',
                },
                { t: 'check', id: 'c1', q: 'Which five red-flag symptoms make preoperative temporal bone CT mandatory, and when do you add contrast and MRI?', a: 'Headache, vertigo, facial nerve paralysis, severe SNHL, or sudden deafness; add contrast-enhanced imaging and MRI whenever intracranial complications are suspected.' },
                { t: 'check', id: 'c2', q: 'On coronal CT, how do you distinguish an attic soft-tissue density caused by tympanosclerosis from attic cholesteatoma?', a: 'Both have soft-tissue density, but tympanosclerosis does not erode the scutum.' },
                { t: 'check', id: 'c3', q: 'Why does cholesteatoma appear bright on non-EPI DWI (HASTE) MRI, and how does this change CWU management?', a: 'Keratin restricts water diffusion, producing bright hyperintensity, allowing MRI surveillance that reduces the need for routine second-stage CWU surgery.' },
                { t: 'practice', title: 'Apply it', refs: ['cholesteatoma:q18', 'cholesteatoma:q19', 'ear-anatomy:q51'] },
            ],
            drill: [{ m: 'cholesteatoma', c: ['cholesteatoma-imaging'] }],
        },
    ],
};
