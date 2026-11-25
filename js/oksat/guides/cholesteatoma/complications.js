/* =============================================================
   Complications of chronic otitis media and cholesteatoma
   OKSAT · Interactive learning · cholesteatoma · chapter 4
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'complications',
    title: 'Complications of chronic otitis media and cholesteatoma',
    kicker: '4 · Complications',
    review: 'draft',
    lede: 'Intratemporal and intracranial spread: pediatric vs adult mastoiditis and abscess tracking, facial nerve injury and erosion, labyrinthine fistula, tegmen hemostasis, lateral sinus thrombosis, otitic hydrocephalus, and brain abscess.',
    src: 'C2 · P16 · J7 · J8 · K15 · K16 · E52',
    tldr: [
        'Complications occur 9:1 in COM/cholesteatoma vs AOM, with 7–25% postantibiotic mortality; pediatric mastoiditis presents with fossa mastoidea tenderness and open cribriform postauricular abscesses, whereas adults show mastoid tip tenderness and Bezold abscesses, and CIs are nearly always saved with early I&D, tube, and IV antibiotics.',
        'Classic iatrogenic CN VII injury is a cutting-burr swipe at the second genu; cholesteatoma erodes superior to the stapes (posterior attic) or near the geniculate (anterior attic), with 52–83% HB I–II recovery after matrix removal.',
        'Labyrinthine fistula occurs in 7–10% of cholesteatomas (90% lateral canal), is missed on CT ~40% of the time (57–60% accuracy), often coexists with tympanic CN VII erosion, and demands avoiding ototoxic drops if the lumen is entered.',
        'Avoid electrocautery on exposed tegmen dura (use gelatin sponge–adrenalin pledgets; repair extensive defects to prevent encephalocele); meningitis is the most common intracranial complication (image before LP), and LST features picket-fence fevers, Griesinger sign, empty delta sign, and underlying prothrombotic disorders in children (5/7).',
        'Otitic hydrocephalus threatens vision despite normal CSF and non-enlarged ventricles (worsening vision → optic nerve decompression); subdural empyema (5–30% mortality; MRI; no LP) and brain abscess (10% mortality, 80% if intraventricular rupture) are neurosurgical emergencies.',
    ],
    sections: [
        {
            id: 'mastoiditis-apicitis',
            ref: [
                'Otology/Acute coalescent mastoiditis causes trabecular osteoclasis and subperiosteal abscess formation',
                'Otology/Subperiosteal mastoid abscesses are categorized into postauricular, Bezold, Citelli, and zygomatic abscesses based on anatomical planes of pus tracking',
                'Otology/Gradenigo triad of otorrhea, retroorbital pain, and abducens nerve palsy indicates suppurative petrous apicitis',
                'Pediatrics/Pediatric acute mastoiditis with subperiosteal abscess requires intravenous ceftriaxone, myringotomy tube placement, and cortical mastoidectomy',
            ],
            n: '4.1',
            title: 'Epidemiology, mastoiditis, subperiosteal abscesses, and petrous apicitis',
            blocks: [
                { t: 'p', x: 'Intratemporal and intracranial complications occur in a **9:1 ratio** favoring COM/cholesteatoma over AOM, with postantibiotic mortality of **7–25%**. **Coalescent mastoiditis** is defined by erosion of mastoid air cell septations (versus **masked mastoiditis**, partially antibiotic-treated but still painful). **Postauricular subperiosteal mastoid abscess** occurs most often in very young children because the newborn mastoid cribriform area contains open channels between the mastoid interior and cortex. In acute coalescent mastoiditis, tenderness is over the **mastoid tip in adults**, whereas in **children with incomplete pneumatization** it is over the **fossa mastoidea near the antrum**. **Bezold abscess** results from pus perforating the thin medial cortex of the mastoid tip and tracking **medial to the SCM** into the neck. [[src|K15]] [[src|C2]]' },
                { t: 'p', x: '**Petrous apicitis** is associated with **Gradenigo syndrome**: the triad of **diplopia (ipsilateral CN VI palsy)**, **retrobulbar pain**, and **persistent otorrhea**. The **anterior petrous apex** is pneumatized in **10%** of temporal bones (compared with **30%** for the posterior petrous apex). In **cochlear-implanted children** with acute mastoiditis and subperiosteal abscess, early **I&D, myringotomy/ventilation tube, and IV antibiotics** virtually always save the device; outside the cochlear-implant setting, standard care for a pediatric subperiosteal abscess is **IV ceftriaxone, a tympanostomy tube, and cortical mastoidectomy**. [[src|K15]] [[src|C2]] [[src|P16]]' },
                {
                    t: 'table',
                    head: ['Complication feature', 'Pediatric', 'Adult'],
                    rows: [
                        ['Coalescent mastoiditis tenderness', 'Fossa mastoidea near antrum [[src|K15]]', 'Mastoid tip [[src|K15]]'],
                        ['Subperiosteal abscess path', 'Postauricular via open newborn cribriform channels [[src|K15]]', 'Bezold abscess medial to SCM through mastoid tip [[src|K15]]'],
                        ['Facial palsy (AOM vs COM/cholesteatoma)', 'AOM: abrupt, incomplete paresis, rapid full recovery [[src|K15]]', 'COM/cholesteatoma: erosive; 52–83% HB I–II after matrix removal [[src|K15]] [[src|K16]]'],
                        ['LST workup', 'Screen for prothrombotic disorders — 5 of 7 children [[src|K15]]', 'Contrast CT empty delta / MRV + mastoidectomy and IV antibiotics [[src|K15]]'],
                        ['Cochlear-implanted child with abscess', 'Early I&D + myringotomy/tube + IV antibiotics almost always saves implant [[src|P16]]', 'Pediatric focus [[src|P16]]'],
                    ],
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/complication-routes-map.svg',
                    alt: 'Schematic map of intratemporal and intracranial complication pathways spreading from the middle ear and mastoid antrum: superiorly through the tegmen, medially to the otic capsule and fallopian canal, posteriorly to the sigmoid plate, and inferiorly/anteromedially to the mastoid cortex and petrous apex.',
                    cap: 'Intratemporal and intracranial cholesteatoma complication routes from the middle ear and mastoid antrum. Schematic (OKSAT)',
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/mastoiditis-postauricular-abscess.jpg',
                    alt: 'Clinical photograph of postauricular coalescent mastoiditis and subperiosteal abscess displacing the left pinna laterally and inferiorly.',
                    cap: 'Postauricular coalescent mastoiditis and subperiosteal abscess displacing the left pinna laterally and inferiorly. Kirtane, de Souza & Sanna, Otology and Neurotology (Thieme, 2013), Fig. 15.1.',
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/ct-coalescent-mastoiditis.jpg',
                    alt: 'Noncontrast axial temporal bone CT demonstrating left coalescent mastoiditis with loss of mastoid air cell bony septations.',
                    cap: 'Noncontrast axial temporal bone CT showing left coalescent mastoiditis with loss of air cell septations. Kirtane, de Souza & Sanna, Otology and Neurotology (Thieme, 2013), Fig. 15.2.',
                },
                { t: 'check', id: 'c1', q: 'Contrast where tenderness sits in acute coalescent mastoiditis in young children versus adults, and explain why infants get postauricular abscesses while adults get Bezold abscesses.', a: 'Fossa mastoidea near the antrum in children (open newborn cribriform channels lead to postauricular abscess) vs mastoid tip in adults (pus breaks through the thin medial tip cortex medial to SCM in Bezold abscess).' },
                { t: 'check', id: 'c2', q: 'Name the triad of Gradenigo syndrome and the pneumatization rate of the anterior versus posterior petrous apex.', a: 'Diplopia (ipsilateral CN VI palsy), retrobulbar pain, and persistent otorrhea; anterior petrous apex 10% vs posterior 30%.' },
                { t: 'check', id: 'c3', q: 'A toddler with a cochlear implant develops acute mastoiditis and a postauricular subperiosteal abscess. Must the implant be explanted immediately?', a: 'No; early I&D, myringotomy/ventilation tube, and IV antibiotics virtually always save the device.' },
                { t: 'practice', title: 'Apply it', refs: ['cholesteatoma:q34', 'cholesteatoma:q35'] },
            ],
            drill: [{ m: 'cholesteatoma', c: ['mastoiditis-apicitis'] }],
        },
        {
            id: 'facial-nerve-complications',
            ref: ['Otology/House-Brackmann grading system stratifies facial nerve function from Grade I normal to Grade VI total paralysis'],
            n: '4.2',
            title: 'Facial nerve paralysis and intraoperative nerve injury',
            blocks: [
                { t: 'p', x: 'The classic site of **iatrogenic facial nerve injury** during mastoidectomy is a **cutting-burr swipe injury at the second genu**. **Posterior epitympanic** cholesteatoma classically erodes the fallopian canal **just superior to the stapes**, whereas **anterior epitympanic** cholesteatoma erodes near the **geniculate ganglion**. The tympanic segment of the facial nerve is dehiscent in **25% to 55%** of temporal bones. [[src|J7]] [[src|J8]] [[src|C2]]' },
                {
                    t: 'cards',
                    cols: 2,
                    items: [
                        {
                            h: 'Pediatric AOM facial palsy',
                            blocks: [
                                { t: 'p', x: 'Presents in children with **abrupt onset**, **incomplete paresis**, and **rapid full recovery** with treatment. [[src|K15]]' },
                            ],
                        },
                        {
                            h: 'COM / cholesteatoma facial palsy',
                            blocks: [
                                { t: 'p', x: 'Erosion of the fallopian canal (superior to stapes or at geniculate); recovers to **HB grade I or II in 52–83%** of patients after matrix removal. [[src|J8]] [[src|K16]]' },
                            ],
                        },
                    ],
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/fn-second-genu-swipe.png',
                    alt: 'Illustration of the classic cutting-burr swipe injury to the facial nerve at the second genu during mastoidectomy.',
                    cap: 'Classic cutting-burr swipe injury to the facial nerve at the second genu during mastoidectomy. Jackler, Ear Surgery Illustrated (Thieme, 2019), Fig. 7.56.',
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/fn-cholesteatoma-erosion.png',
                    alt: 'Illustration showing posterior epitympanic cholesteatoma eroding the fallopian canal superior to the stapes and anterior epitympanic disease eroding near the geniculate ganglion.',
                    cap: 'Fallopian canal erosion by posterior epitympanic (superior to stapes) and anterior epitympanic (near geniculate ganglion) cholesteatoma. Jackler, Ear Surgery Illustrated (Thieme, 2019), Fig. 8.76.',
                },
                { t: 'check', id: 'c1', q: 'Where is the classic iatrogenic mastoidectomy injury to the facial nerve, and with which instrument?', a: 'Cutting-burr swipe injury at the second genu.' },
                { t: 'check', id: 'c2', q: 'Compare the site of fallopian canal erosion for posterior versus anterior epitympanic cholesteatoma, and state the expected HB I–II recovery rate after matrix removal.', a: 'Posterior epitympanic erodes just superior to the stapes; anterior epitympanic erodes near the geniculate ganglion; 52–83% recover to HB grade I or II.' },
                { t: 'practice', title: 'Apply it', refs: ['cholesteatoma:q36', 'cholesteatoma:q37', 'ear-anatomy:q151'] },
            ],
            drill: [{ m: 'cholesteatoma', c: ['facial-nerve-complications'] }],
        },
        {
            id: 'labyrinthine-fistula',
            ref: [
                'Otology/Labyrinthine fistula from cholesteatoma erosions most frequently involves the lateral semicircular canal',
                'Otology/Management of a labyrinthine fistula requires preservation of the matrix until complete bony exposure',
            ],
            n: '4.3',
            title: 'Labyrinthine fistula',
            blocks: [
                { t: 'p', x: 'Labyrinthine fistula occurs in **~7–10%** of cholesteatomas, with the **horizontal/lateral semicircular canal (LSCC)** accounting for **90%** of fistulae. Fistulas are more common in **poorly pneumatized temporal bones** because dense lateral bone directs erosive force medially to the otic capsule. Whenever a semicircular canal fistula occurs, the **tympanic segment of the facial nerve is also frequently eroded** and requires extra care. [[src|K15]] [[src|J8]]' },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Never trust a normal CT over the lateral canal',
                    blocks: [
                        { t: 'p', x: 'CT detects labyrinthine fistulae accurately in only **57–60%** of suspected cases, so surgeons must **presume a fistula in every cholesteatoma operation** until the matrix over the lateral canal is inspected directly. [[src|K15]]' },
                    ],
                },
                { t: 'p', x: 'In **open-cavity (CWD)** surgery with a labyrinthine fistula, cholesteatoma matrix is generally **left over the fistula**, whereas in **closed-cavity (CWU)** cases it is **removed with a 6-month second look**. In an **only-hearing ear** or with a **large fistula**, the matrix is left on the fistula (open cavity). If a semicircular canal lumen is entered during surgery, **potentially ototoxic ear drops must be avoided on the packing**. [[src|E52]] [[src|J8]]' },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/ct-lscc-fistula.jpg',
                    alt: 'Axial and coronal temporal bone CT scans demonstrating otic capsule erosion causing a horizontal semicircular canal fistula.',
                    cap: 'Axial and coronal temporal bone CT showing otic capsule erosion into the horizontal semicircular canal. Kirtane, de Souza & Sanna, Otology and Neurotology (Thieme, 2013), Fig. 16.3.',
                },
                { t: 'check', id: 'c1', q: 'What percentage of cholesteatomas have a labyrinthine fistula, which canal accounts for 90%, and why do poorly pneumatized bones have higher rates?', a: '7–10% overall, 90% lateral/horizontal semicircular canal; dense lateral bone in poorly pneumatized mastoids directs erosive force medially onto the otic capsule.' },
                { t: 'check', id: 'c2', q: 'Why must you assume a fistula even when preoperative CT reads intact otic capsule, and what adjacent structure is commonly eroded alongside it?', a: 'CT detects fistulae accurately in only 57–60% of cases; the tympanic segment of the facial nerve is frequently eroded alongside a canal fistula.' },
                { t: 'check', id: 'c3', q: 'How does matrix management over a fistula differ between open-cavity and closed-cavity surgery, and what postoperative packing error must be avoided if the lumen is opened?', a: 'Matrix is generally left over the fistula in open-cavity (CWD) cases and removed (with a 6-month second look) in closed-cavity (CWU) cases; avoid potentially ototoxic ear drops on the packing if the lumen is entered.' },
                { t: 'practice', title: 'Apply it', refs: ['cholesteatoma:q38', 'cholesteatoma:q39'] },
            ],
            drill: [{ m: 'cholesteatoma', c: ['labyrinthine-fistula'] }],
        },
        {
            id: 'tegmen-meningitis-lst',
            ref: [
                'Otology/Tegmen erosion with dural exposure increases the risk of meningoencephalocele and CSF leak',
                'Otology/Lateral sinus thrombophlebitis presents with picket fence fevers and Griesinger sign requiring intravenous antibiotics and mastoidectomy',
                'Otology/Otogenic intracranial complications escalate from meningitis to sigmoid sinus thrombosis and brain abscess',
            ],
            n: '4.4',
            title: 'Tegmen dural exposure, meningitis, and lateral sinus thrombosis',
            blocks: [
                {
                    t: 'call',
                    k: 'trap',
                    label: 'No cautery on bare tegmen dura',
                    blocks: [
                        { t: 'p', x: 'Bleeding from exposed **tegmen dura** should be controlled with **gelatin sponge–adrenalin pledgets**, **avoiding electrocautery** which can disrupt dura and cause CSF leak. Extensive tegmen dural exposure or erosion should be **repaired** (with cartilage, bone paste, or fascia) to reduce the risk of **meningoencephalic herniation / encephalocele**. [[src|J7]]' },
                    ],
                },
                { t: 'p', x: '**Meningitis** is the **most common intracranial complication** of acute and chronic otitis media (**CT/MRI must precede LP**). **LST** features **"picket fence" fever**, **Griesinger sign** (postauricular tenderness/edema from mastoid emissary vein thrombosis), and the **empty delta sign** on contrast CT. Pediatric otogenic LST is frequently associated with underlying **prothrombotic disorders** (**5 of 7** children in one series). [[src|K15]]' },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/tegmen-dural-exposure.png',
                    alt: 'Illustration of extensive tegmen dural exposure requiring repair to prevent meningoencephalic herniation.',
                    cap: 'Extensive tegmen dural exposure requiring repair to prevent meningoencephalic herniation. Jackler, Ear Surgery Illustrated (Thieme, 2019), Fig. 7.43.',
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/ct-empty-delta-sign.jpg',
                    alt: 'Contrast-enhanced axial CT demonstrating the empty delta sign of left sigmoid/lateral sinus thrombosis with surrounding dural enhancement.',
                    cap: 'Contrast-enhanced axial CT showing the empty delta sign of left sigmoid/lateral sinus thrombosis. Kirtane, de Souza & Sanna, Otology and Neurotology (Thieme, 2013), Fig. 15.5.',
                },
                { t: 'check', id: 'c1', q: 'How should you stop bleeding from exposed tegmen dura during mastoidectomy, and why repair extensive tegmen exposure?', a: 'Gelatin sponge–adrenalin pledgets—avoid electrocautery (causes dural disruption/CSF leak); repair with cartilage, bone paste, or fascia to reduce encephalocele risk.' },
                { t: 'check', id: 'c2', q: 'Name the classic clinical and contrast-CT triad of lateral sinus thrombosis, and the extra workup needed in children.', a: 'Picket fence fever, Griesinger sign (postauricular tenderness/edema from mastoid emissary vein thrombosis), and empty delta sign on contrast CT; in children, evaluate for underlying prothrombotic disorders (found in 5 of 7 children).' },
                { t: 'practice', title: 'Apply it', refs: ['cholesteatoma:q40', 'cholesteatoma:q41', 'ear-anatomy:q53'] },
            ],
            drill: [{ m: 'cholesteatoma', c: ['tegmen-meningitis-lst'] }],
        },
        {
            id: 'intracranial-abscess-hydrocephalus',
            ref: ['Otology/Otogenic intracranial complications escalate from meningitis to sigmoid sinus thrombosis and brain abscess'],
            n: '4.5',
            title: 'Otitic hydrocephalus, subdural empyema, and parenchymal brain abscess',
            blocks: [
                { t: 'p', x: 'Whenever intracranial complications of cholesteatoma are suspected, **contrast-enhanced imaging and MRI** are required in addition to noncontrast temporal bone CT. [[src|E52]]' },
                {
                    t: 'table',
                    head: ['Intracranial complication', 'Key presentation, imaging, LP rule, and mortality/trigger'],
                    rows: [
                        ['Meningitis', 'Most common intracranial complication of AOM/COM; CT/MRI must precede LP [[src|K15]]'],
                        ['Lateral sinus thrombosis (LST)', 'Picket-fence fever, Griesinger sign, empty delta sign on contrast CT / MRV; pediatric prothrombotic disorders (5 of 7) [[src|K15]]'],
                        ['Otitic hydrocephalus', 'Elevated ICP, papilledema, and CN VI palsy with normal CSF and non-enlarged ventricles; worsening vision/ophthalmologic exam indicates optic nerve decompression [[src|K16]]'],
                        ['Subdural empyema', 'Neurosurgical emergency with 5–30% mortality even in the antibiotic era; MRI preferred and LP contraindicated [[src|K16]]'],
                        ['Parenchymal brain abscess', 'Temporal lobe or cerebellum; 10% mortality, rising to 80% with intraventricular rupture [[src|K16]]'],
                    ],
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/mri-cerebellar-abscess.jpg',
                    alt: 'Contrast-enhanced axial brain MRI showing a ring-enhancing otogenic abscess in the left cerebellum.',
                    cap: 'Contrast-enhanced axial MRI demonstrating a ring-enhancing otogenic cerebellar abscess. Kirtane, de Souza & Sanna, Otology and Neurotology (Thieme, 2013), Fig. 15.7.',
                },
                { t: 'check', id: 'c1', q: 'Why is otitic hydrocephalus a misnomer on neuroimaging, and what clinical change triggers optic nerve decompression?', a: 'Ventricles are not enlarged (and CSF is normal) despite elevated ICP, papilledema, and CN VI palsy; worsening ophthalmologic exam or vision is the indication for optic nerve decompression.' },
                { t: 'check', id: 'c2', q: 'Compare the mortality and LP rules for subdural empyema versus otogenic parenchymal brain abscess.', a: 'Subdural empyema has 5–30% mortality, MRI is preferred, and LP is contraindicated; parenchymal brain abscess (temporal lobe or cerebellum) has 10% mortality, jumping to 80% with intraventricular rupture.' },
                { t: 'practice', title: 'Apply it', refs: ['cholesteatoma:q42', 'cholesteatoma:q43'] },
            ],
            drill: [{ m: 'cholesteatoma', c: ['intracranial-abscess-hydrocephalus'] }],
        },
    ],
};
