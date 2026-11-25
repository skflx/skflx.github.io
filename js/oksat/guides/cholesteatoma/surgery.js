/* =============================================================
   Surgery: CWU vs CWD, surveillance, recidivism, and ossiculoplasty
   OKSAT · Interactive learning · cholesteatoma · chapter 3
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'surgery',
    title: 'Surgery: CWU vs CWD, surveillance, recidivism, and ossiculoplasty',
    kicker: '3 · Mastoidectomy & OCR',
    review: 'draft',
    lede: 'Mastoidectomy landmarks and residual vs recurrent disease, why pediatric CWU preference diverges from adult CWD rules, surveillance intervals, dry-cavity mechanics, and ossicular reconstruction.',
    src: 'C2 · P16 · J7 · J8 · K16 · K17 · E41 · E44 · E47 · E48 · E51 · E53–E56',
    tldr: [
        'Residual cholesteatoma is squamous epithelium left behind (most often under the tympanic CN VII, around the stapes/oval window, facial recess, and sinus tympani); recurrent cholesteatoma is a new retraction pocket forming de novo.',
        'In adults, CWD yields lower recidivism than CWU (up to 20% in CWU) and is favored for only-hearing ear, large fistula, bilateral disease, or severe hypopneumatization; in children, **CWU is favored (~90%)** because children tolerate open cavities poorly and cortical bone regrows, and pediatric consensus explicitly rejects mandatory CWD rules for children.',
        'Second-look CWU timing is a range—earlier in children (6 months children vs 6–18 months adults); non-EPI DWI reduces second-stage surgery, and CWU requires ≥10 years of otoscopic follow-up.',
        'Avoid a wet CWD cavity by widening the meatus, lowering the facial ridge (leaving 2–3 mm bone over CN VII), beveling overhangs, and amputating a prominent mastoid tip; pediatric mastoid/attic obliteration drops 5-year revision from 15–20% to 2–3%.',
        'Autologous incus interposition is preferred (75% normal hearing in children); adult PORP hits ≤15 dB and TORP ≤25 dB in two-thirds of patients, and cartilage interposition halves hydroxyapatite extrusion from 7.9% to 3.7%.',
    ],
    sections: [
        {
            id: 'mastoid-landmarks-recidivism',
            ref: [
                'Otology/Posterior tympanotomy facial recess approach opens the corridor between CN VII and chorda tympani',
                'Otology/The facial recess is bounded by the facial nerve, chorda tympani, and fossa incudis',
                'Otology/Complete cortical mastoidectomy unroofs the mastoid antrum and establishes dependent middle ear drainage',
                'Otology/The infant mastoid lacks a developed tip placing the facial nerve in a subcutaneous vulnerable position at the stylomastoid foramen',
            ],
            n: '3.1',
            title: 'Mastoidectomy landmarks, facial recess, and residual vs recurrent disease',
            blocks: [
                {
                    t: 'cards',
                    cols: 2,
                    items: [
                        {
                            h: 'Residual cholesteatoma',
                            blocks: [
                                { t: 'p', x: 'Arises from a fragment of squamous epithelium left behind during surgery. Most common sites: **under the tympanic facial nerve**, **around the stapes/oval window**, the **facial recess**, and the **sinus tympani**. [[src|J8]]' },
                            ],
                        },
                        {
                            h: 'Recurrent cholesteatoma',
                            blocks: [
                                { t: 'p', x: 'A new retraction pouch forming de novo after surgery; prevented by cartilage reinforcement, ventilation, or exteriorization with CWD. [[src|J8]]' },
                            ],
                        },
                    ],
                },
                { t: 'p', x: 'ICW (CWU) mastoidectomy is bounded superiorly by the **tegmen**, posteriorly by the **sigmoid sinus**, and anteriorly by the **ear canal**. **Koerner septum** (petrosquamous septum) is a flat bony sheet representing a false bottom that must be penetrated to enter the mastoid antrum. The **sinodural angle** between the tegmen and sigmoid sinus is also known as **Citelli angle**. [[src|J7]]' },
                { t: 'p', x: 'The **facial recess** is bounded by the **chorda tympani and tympanic annulus laterally**, the **facial nerve medially**, and the **incus buttress superiorly**. During CWU posterior tympanotomy, the **LSCC** lies just superomedial to the second genu and must not be opened. The tympanic segment of the facial nerve is dehiscent in **25% to 55%** of temporal bones. **Silastic sheeting** placed through the facial recess toward the ET prevents adhesions between graft and denuded wall and promotes mucosal regeneration. [[src|K16]] [[src|E53]] [[src|C2]]' },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Infant postauricular incision',
                    blocks: [
                        { t: 'p', x: 'In infants and toddlers, incomplete mastoid tip development places the facial nerve superficially at risk in the **lower limb of a postauricular incision**. [[src|J7]]' },
                    ],
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/cwu-boundaries.png',
                    alt: 'Surgical diagram of an intact canal wall mastoidectomy bounded by the tegmen superiorly, sigmoid sinus posteriorly, and ear canal anteriorly.',
                    cap: 'CWU (intact canal wall) mastoidectomy boundaries: tegmen superiorly, sigmoid sinus posteriorly, and ear canal anteriorly. Jackler, Ear Surgery Illustrated (Thieme, 2019), Fig. 7.2.',
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/residual-vs-recurrent.png',
                    alt: 'Side-by-side illustration contrasting residual cholesteatoma (left-behind squamous pearl) with recurrent cholesteatoma (de novo retraction pocket).',
                    cap: 'Residual cholesteatoma (left-behind matrix) versus recurrent cholesteatoma (de novo retraction pocket). Jackler, Ear Surgery Illustrated (Thieme, 2019), Fig. 8.64.',
                },
                { t: 'check', id: 'c1', q: 'Define residual versus recurrent cholesteatoma, and list the four most common sites of residual disease.', a: 'Residual is epithelium left behind at surgery; recurrent is a new retraction pocket forming de novo. Top residual sites: under the tympanic CN VII, around stapes/oval window, facial recess, and sinus tympani.' },
                { t: 'check', id: 'c2', q: 'State the three boundaries of the facial recess and the inner ear structure lying just superomedial to the second genu during posterior tympanotomy.', a: 'Chorda tympani and tympanic annulus laterally, facial nerve medially, incus buttress superiorly; the lateral semicircular canal.' },
                { t: 'check', id: 'c3', q: 'What surgical trap is Koerner septum, and why does a postauricular incision threaten the facial nerve in an infant?', a: 'Koerner septum is a flat bony false bottom that must be penetrated to enter the true antrum; incomplete mastoid tip development in infants and toddlers leaves CN VII superficial in the lower limb of the incision.' },
                { t: 'practice', title: 'Apply it', refs: ['cholesteatoma:q20', 'cholesteatoma:q21', 'ear-anatomy:q63'] },
            ],
            drill: [{ m: 'cholesteatoma', c: ['mastoid-landmarks-recidivism'] }],
        },
        {
            id: 'cwu-vs-cwd',
            ref: [
                'Otology/Canal wall up mastoidectomy preserves the posterior bony external auditory canal wall',
                'Otology/Canal wall down mastoidectomy lowers the facial ridge and exteriorizes the mastoid into the ear canal',
            ],
            n: '3.2',
            title: 'Canal wall up vs canal wall down: adult vs pediatric indications',
            blocks: [
                { t: 'p', x: 'Adult meta-analyses demonstrate lower rates of recidivistic cholesteatoma after CWD compared with CWU surgery. CWU mastoidectomy carries up to a **20%** recidivism rate, so nearly all CWU patients historically required a planned second-look operation before OCR. Sanna center uses CWU in fewer than **10%** of adult cases due to higher risk of residual or recurrent disease, performing CWD in adults with marked scutum or attic erosion, sclerotic mastoids, or atelectasis. [[src|P16]] [[src|K16]] [[src|E47]] [[src|E54]]' },
                { t: 'p', x: 'Adult indications favoring primary CWD include cholesteatoma in an **only-hearing ear**, extensive canal wall destruction, **large labyrinthine fistula**, **bilateral cholesteatoma** (high recurrence after ICW), and **severe mastoid hypopneumatization** (resulting cavity is small). If recurrent cholesteatoma or posterior canal wall absorption is encountered at second-stage CWU surgery, convert to CWD. [[src|K16]] [[src|J8]] [[src|E47]] [[src|E53]]' },
                { t: 'p', x: 'In **children**, **CWU surgery is favored** because open mastoid cavities are poorly tolerated and often require GA for debridement, and robust regrowth of mastoid cortical bone in children can compromise adequate access through a CWD meatoplasty. Initial CWD surgery is used in only **~10%** of pediatric cholesteatoma cases (e.g., constricted mastoid, poor follow-up, or reluctance for second-stage surgery). [[src|P16]]' },
                {
                    t: 'table',
                    head: ['Feature', 'Pediatric', 'Adult'],
                    rows: [
                        ['Preferred primary approach', 'CWU (~90%); initial CWD only ~10% [[src|P16]]', 'CWD has lower recidivism; often preferred for sclerotic, extensive, or bilateral disease [[src|P16]] [[src|K16]] [[src|J8]]'],
                        ['Cavity tolerance', 'Poor; often requires GA for debridement [[src|P16]]', 'Office debridement tolerated [[src|P16]]'],
                        ['Bone behavior', 'Robust cortical bone regrowth compromises meatoplasty access [[src|P16]]', 'Stable bony cavity [[src|P16]]'],
                        ['Only-hearing ear, fistula, or bilateral', 'CWD not mandatory [[src|P16]]', 'Classic indications for CWD [[src|K16]] [[src|J8]]'],
                        ['Revision rate & obliteration', '15–20% CWU/CWD alone → 2–3% at 5 yr with obliteration [[src|P16]]', 'Up to 20% CWU recidivism; Gantz CWR 1.5% revision CWD [[src|K16]]'],
                        ['Second-look interval', 'Earlier: 6 months [[src|K17]]', '6–18 months [[src|K17]]'],
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'CWD "mandatory" for only-hearing ear, labyrinthine fistula, or bilateral cholesteatoma: in **adults**, key to Kirtane, Jackler, and Sanna (favors primary CWD). In **children**, Cummings Pediatric Ch. 16 explicitly disagrees that CWD is mandatory in these three settings. Note also that Sanna favors pediatric CWU for "highly cellular" mastoids, whereas Cummings Pediatric Ch. 16 shows pediatric mastoids are underdeveloped and favors CWU for cavity intolerance and cortical regrowth. [[src|P16]] [[src|K16]] [[src|J8]] [[src|E47]] [[src|E48]]' },
                    ],
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/cwd-cavity.png',
                    alt: 'Illustration of a completed canal wall down mastoidectomy exteriorizing the attic and mastoid into the external canal.',
                    cap: 'Completed CWD mastoidectomy exteriorizing the attic and mastoid into the EAC. Jackler, Ear Surgery Illustrated (Thieme, 2019), Fig. 8.19.',
                },
                { t: 'check', id: 'c1', q: 'Give the two main child-specific reasons why CWU is favored over CWD in ~90% of pediatric cholesteatomas despite adult meta-analyses showing lower recidivism with CWD.', a: 'Children tolerate open-cavity maintenance poorly (often requiring GA for debridement), and robust regrowth of pediatric cortical bone compromises meatoplasty access.' },
                { t: 'check', id: 'c2', q: 'In an adult versus a child, how does an only-hearing ear, labyrinthine fistula, or bilateral cholesteatoma influence CWU vs CWD choice?', a: 'In adults, these are classic indications for primary CWD; in children, CWD is not mandatory, with initial CWD (~10%) reserved for constricted mastoid, poor follow-up, or reluctance for second-stage surgery.' },
                { t: 'check', id: 'c3', q: 'What two findings at second-stage CWU surgery prompt conversion to CWD?', a: 'Recurrent cholesteatoma or absorption of the posterior canal wall.' },
                { t: 'practice', title: 'Apply it', refs: ['cholesteatoma:q23', 'cholesteatoma:q24', 'ear-anatomy:q66'] },
            ],
            drill: [{ m: 'cholesteatoma', c: ['cwu-vs-cwd'] }],
        },
        {
            id: 'staging-surveillance',
            ref: [
                'Otology/Second-look surgery or non-EPI DWI MRI is indicated twelve to eighteen months after canal wall up mastoidectomy',
                'Otology/Non-echo-planar diffusion-weighted MRI detects recurrent and residual cholesteatoma as small as two millimeters',
            ],
            n: '3.3',
            title: 'Second-look staging, MRI surveillance, and follow-up',
            blocks: [
                { t: 'p', x: 'Because CWU carries up to **20%** recidivism, nearly all CWU patients historically underwent a planned second-look operation to check for residual pearls and reconstruct the ossicular chain. The recommended interval between first-stage mastoidectomy and second-stage OCR or second look is **shorter in children (6 months) than in adults (6–18 months)**. Surveillance with **non-EPI DWI MRI** can reduce the need for second-stage CWU procedures. [[src|K16]] [[src|K17]] [[src|P16]] [[src|E53]]' },
                { t: 'p', x: 'After CWU tympanoplasty, regular **otoscopic follow-up for at least 10 years** is essential to detect new retraction pockets or recurrent cholesteatoma. If recurrent cholesteatoma or posterior canal wall absorption is found at second-stage CWU surgery, convert to CWD. [[src|E53]]' },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'Second-look timing varies by source—teach as a **range, earlier in children**: Kirtane Ch. 17 recommends **6 months** in children vs **6–18 months** in adults; Jackler Ch. 8 quotes **~6 months**; Sanna quotes **6–8 months**, **8–12 months**, and **1 year** for diffuse middle ear epidermization. Never key a question to one exact month. [[src|K17]] [[src|J8]] [[src|E51]] [[src|E53]] [[src|E41]]' },
                    ],
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/second-stage-silastic.png',
                    alt: 'Illustration of removing middle ear Silastic sheeting at planned second-stage surgery to reveal regenerated mucosa.',
                    cap: 'Removing middle ear Silastic sheeting at planned second-stage CWU surgery to reveal regenerated mucosa. Jackler, Ear Surgery Illustrated (Thieme, 2019), Fig. 6.46.',
                },
                { t: 'check', id: 'c1', q: 'How does the recommended second-look interval compare between children and adults, and why is it taught as a range rather than one exact month?', a: 'Shorter in children (6 months) than in adults (6–18 months); surgical atlases quote ranges from 6 to 12+ months.' },
                { t: 'check', id: 'c2', q: 'If non-EPI DWI surveillance replaces a routine second look after CWU, how long must otoscopic follow-up still continue and why?', a: 'At least 10 years, to detect new retraction pockets or late recurrent cholesteatoma.' },
                { t: 'practice', title: 'Apply it', refs: ['cholesteatoma:q26', 'cholesteatoma:q27'] },
            ],
            drill: [{ m: 'cholesteatoma', c: ['staging-surveillance'] }],
        },
        {
            id: 'cwd-mechanics-variants',
            ref: [
                'Otology/Lowering the facial ridge flush with the facial nerve is essential to prevent dependent cavity pooling',
                'Otology/Wide meatoplasty provides adequate aeration and easy cleaning of a canal wall down mastoid cavity',
                'Otology/Mastoid obliteration with local muscle flaps or bioactive glass reduces cavity volume and discharge',
            ],
            n: '3.4',
            title: 'CWD cavity mechanics, obliteration, atticotomy, and modified Bondy',
            blocks: [
                { t: 'p', x: 'In CWD tympanoplasty, the two consistent landmarks for identifying the facial nerve are the **cochleariform process** and the **digastric ridge**. When lowering the facial ridge in CWD mastoidectomy, leaving **2 to 3 mm** of bone over the facial nerve preserves middle ear space. [[src|E54]] [[src|J8]]' },
                {
                    t: 'table',
                    head: ['Technical cause of wet CWD cavity', 'Operative fix'],
                    rows: [
                        ['Narrow meatus [[src|E54]]', 'Wide meatoplasty for aeration and cleaning [[src|E54]]'],
                        ['High facial ridge [[src|E54]]', 'Lower ridge leaving 2–3 mm bone over CN VII [[src|E54]] [[src|J8]]'],
                        ['Overhanging edges [[src|E54]]', 'Bevel and saucerize cavity margins [[src|E54]]'],
                        ['Prominent mastoid tip [[src|E54]]', 'Amputate tip to reduce volume and prevent a sink trap [[src|E54]]'],
                    ],
                },
                {
                    t: 'cards',
                    cols: 2,
                    items: [
                        {
                            h: 'Atticotomy',
                            blocks: [
                                { t: 'p', x: 'Indicated for cholesteatoma limited to Prussak space without aditus ad antrum or mastoid extension, with mandatory scutal reconstruction. Place cartilage on the **ear canal side** rather than the mastoid side to discourage recurrence. [[src|K16]] [[src|J8]]' },
                            ],
                        },
                        {
                            h: 'Retrograde ("inside-out")',
                            blocks: [
                                { t: 'p', x: 'Removes only bone overlying the cholesteatoma, differing from a Bondy procedure because uninvolved mastoid air cells are undisturbed. [[src|J8]]' },
                            ],
                        },
                        {
                            h: 'Modified Bondy technique',
                            blocks: [
                                { t: 'p', x: 'One-stage CWD procedure for epitympanic cholesteatoma lateral to an intact ossicular chain with intact TM and good hearing. Main risk is **high-frequency SNHL from acoustic trauma** drilling around the intact chain; place **cartilage (never bone paste)** medial to the incus body/malleus head to avoid ossicular fixation. Sanna 303-case series (5-year follow-up): **0%** recurrent, **0%** medial residual, **8.1%** lateral residual. [[src|E55]]' },
                            ],
                        },
                        {
                            h: 'Obliteration & Gantz CWR',
                            blocks: [
                                { t: 'p', x: 'Most surgeons use mastoid obliteration only in CWD because of recurrence risk in ICW. In children, CWD and CWU alone carry a **15% to 20%** revision rate, which mastoid/attic obliteration lowers to **2% to 3%** at **5 years**. In **Gantz CWR** with mastoid obliteration (130 ears), only **1.5%** required revision CWD. [[src|J7]] [[src|P16]] [[src|K16]]' },
                            ],
                        },
                    ],
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/cwd-facial-ridge.png',
                    alt: 'Illustration of lowering the facial ridge in CWD mastoidectomy while leaving 2 to 3 mm of bone over the facial nerve.',
                    cap: 'Lowering the facial ridge in CWD mastoidectomy while preserving 2 to 3 mm of bone over CN VII. Jackler, Ear Surgery Illustrated (Thieme, 2019), Fig. 8.34.',
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/modified-bondy.png',
                    alt: 'Illustration of a Bondy modified radical mastoidectomy exteriorizing lateral attic disease while leaving the middle ear and ossicular chain intact.',
                    cap: 'Modified Bondy procedure exteriorizing lateral attic cholesteatoma over an intact ossicular chain and TM. Jackler, Ear Surgery Illustrated (Thieme, 2019), Fig. 8.38.',
                },
                { t: 'check', id: 'c1', q: 'List the four technical errors that create a chronically draining CWD cavity, and name the two consistent landmarks for the facial nerve during CWD surgery.', a: 'Narrow meatus, high facial ridge, overhanging edges, and prominent mastoid tip ("sink trap"); cochleariform process and digastric ridge.' },
                { t: 'check', id: 'c2', q: 'Who is the ideal candidate for a modified Bondy procedure, what is its main inner ear risk, and why is cartilage used instead of bone paste medial to the ossicular heads?', a: 'Epitympanic cholesteatoma lateral to an intact ossicular chain with intact TM and good hearing; high-frequency SNHL from acoustic trauma drilling near the intact chain; bone paste risks ossicular fixation.' },
                { t: 'check', id: 'c3', q: 'On which side of a scutal defect should cartilage be placed, and how much does mastoid/attic obliteration lower pediatric 5-year revision rates?', a: 'Ear canal side (not mastoid side); lowers pediatric revision from 15–20% down to 2–3% at 5 years.' },
                { t: 'practice', title: 'Apply it', refs: ['cholesteatoma:q28', 'cholesteatoma:q29', 'cholesteatoma:q30'] },
            ],
            drill: [{ m: 'cholesteatoma', c: ['cwd-mechanics-variants'] }],
        },
        {
            id: 'ossiculoplasty-rehab',
            ref: [
                'Otology/Partial ossicular replacement prosthesis PORP requires an intact and mobile stapes superstructure',
                'Otology/Total ossicular replacement prosthesis TORP bridges the malleus or tympanic membrane to the stapes footplate',
                'Otology/Cartilage interposition over ossicular prostheses prevents extrusion through the tympanic membrane',
                'Otology/Transcutaneous and percutaneous bone conduction implants bypass conductive and mixed hearing losses',
            ],
            n: '3.5',
            title: 'Ossiculoplasty and hearing rehabilitation',
            blocks: [
                { t: 'p', x: 'Tuning-fork Rinne reversal occurs at an **ABG of about 15 dB for 256 Hz**, **about 25 dB for 512 Hz**, and **about 35 dB for 1024 Hz** (suggesting ossicular involvement). An **autologous incus** is the preferred material for OCR during second-stage tympanoplasty. When the stapes suprastructure is absent but the footplate, incus, and malleus are mobile, a stapes prosthesis crimped to the incus must be **shortened by 0.25 mm** to account for the intact footplate. **Laser removal of the stapes superstructure**—leaving a **high anterior crus** for ossiculoplasty—enables microdissection of cholesteatoma matrix from the footplate. Teenage patients often cope well with unilateral moderate CHL and decline hearing aids or ossiculoplasty. [[src|K17]] [[src|E51]] [[src|J8]] [[src|P16]]' },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'Tuning-fork Rinne reversal is keyed to standard US board values: **256 Hz** at about **15 dB** ABG, **512 Hz** at about **25 dB**, and **1024 Hz** at about **35 dB**. Kirtane Ch. 17 gives lower thresholds (**512 Hz >15 dB** and **1024 Hz >25 dB**). [[src|K17]]' },
                    ],
                },
                {
                    t: 'table',
                    head: ['Option', 'Indication & expected outcome'],
                    rows: [
                        ['Bone cement', 'Limited distal incus necrosis with a <1–2 mm gap; larger gaps need an incus-bridge prosthesis or PORP [[src|K17]]'],
                        ['Autologous incus interposition', 'Preferred second-stage OCR material; achieves normal hearing in 75% of pediatric ears (better than fascia myringostapediopexy) [[src|E51]] [[src|P16]]'],
                        ['PORP', 'Two-thirds of adult patients achieve hearing within 15 dB of bone thresholds [[src|K17]]'],
                        ['TORP', 'Two-thirds of adult patients within 25 dB of bone thresholds; poor long-term pediatric hearing (~1/3 at 5 years) [[src|K17]] [[src|P16]]'],
                        ['Cartilage interposition', 'Omitting cartilage between an alloplastic prosthesis and the TM doubled hydroxyapatite extrusion from 3.7% to 7.9% [[src|K17]]'],
                        ['Percutaneous BCD (pediatric)', 'Higher complication rate in children vs adults: 44% revision, 8% traumatic fracture, often requiring GA for soft-tissue overgrowth [[src|P16]]'],
                    ],
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/autologous-incus-ocr.png',
                    alt: 'Illustration of sculpting an autologous incus body with a socket for the stapes capitulum for ossicular reconstruction.',
                    cap: 'Sculpting an autologous incus body with a socket for the stapes capitulum. Jackler, Ear Surgery Illustrated (Thieme, 2019), Fig. 6.8.',
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/torp-cartilage-interposition.png',
                    alt: 'Illustration of a total ossicular replacement prosthesis with autologous cartilage interposed beneath the tympanic membrane to prevent extrusion.',
                    cap: 'TORP with autologous cartilage interposed beneath the TM to prevent extrusion. Jackler, Ear Surgery Illustrated (Thieme, 2019), Fig. 6.17.',
                },
                { t: 'check', id: 'c1', q: 'Contrast expected adult PORP versus TORP hearing outcomes, and state how omitting cartilage interposition changes hydroxyapatite extrusion.', a: 'Two-thirds within 15 dB of bone for PORP vs within 25 dB for TORP; omitting cartilage doubled extrusion from 3.7% to 7.9%.' },
                { t: 'check', id: 'c2', q: 'In children, how do incus interposition and long-term TORP outcomes compare, and what complication rates distinguish pediatric percutaneous BCDs?', a: 'Incus interposition achieves normal hearing in 75% vs poor long-term TORP (~1/3 at 5 years); pediatric percutaneous BCDs have a 44% revision rate, 8% traumatic fracture rate, and often need GA for soft-tissue overgrowth.' },
                { t: 'check', id: 'c3', q: 'When is bone cement appropriate for incus erosion, and how does the 1024-Hz Rinne test alert you to ossicular involvement?', a: 'Distal incus gap <1–2 mm; Rinne reverses at about 15 dB ABG for 256 Hz, about 25 dB for 512 Hz, and about 35 dB for 1024 Hz, suggesting ossicular involvement.' },
                { t: 'practice', title: 'Apply it', refs: ['cholesteatoma:q31', 'cholesteatoma:q32', 'cholesteatoma:q33'] },
            ],
            drill: [{ m: 'cholesteatoma', c: ['ossiculoplasty-rehab'] }],
        },
    ],
};
