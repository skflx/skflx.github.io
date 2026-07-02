/* =============================================================
   OKSAT study taxonomy — DRAFT scaffolding
   (OHNS Knowledge Self-Assessment Tool.)

   Purpose: a candidate map of the OHNS knowledge domain — the
   topics an OKSAT-style study platform SHOULD eventually cover —
   grouped by the 9 subspecialty keys in OKSAT_SUBSPECIALTIES
   (see oksat-manifest.js). Topics that map to an already-BUILT
   module carry that module's manifest slug in `moduleId`; every
   other topic has `moduleId: null` and is a placeholder awaiting
   content.

   ⚠️ DRAFT — NOT DOCTRINE.
   Every topic object below carries a `// REVIEW` comment. A PGY-2
   (or more senior) OHNS resident MUST validate the full list:
   the topic set, the P1/P2/P3 priorities, the foundational/core/
   advanced difficulty bands, and the derived keywords are all
   authoring scaffolding, not a vetted curriculum. Do not treat
   priorities or difficulty bands as clinically authoritative until
   this status line is cleared.

   Loaded as a plain <script> after oksat-store.js (no build step,
   no imports). Assigns window.OKSAT_TAXONOMY.
   ============================================================= */

(function () {
  'use strict';

  window.OKSAT_TAXONOMY = {
    version: 1,
    status: 'DRAFT — pending clinical review by owner (PGY-2 OHNS). Topics, priorities, and difficulty bands are scaffolding, not doctrine.',
    topics: [

      // ═══════════════ OTOLOGY / NEUROTOLOGY ═══════════════
      { id: 'vestibular-schwannoma', label: 'Vestibular Schwannoma', subspecialty: 'otology', moduleId: 'vestibular-schwannoma', priority: 1, difficultyBand: 'core', keywords: ['acoustic neuroma', 'cpa', 'iac', 'nf2', 'koos'] }, // REVIEW
      { id: 'chronic-otitis-media-cholesteatoma', label: 'Chronic Otitis Media & Cholesteatoma', subspecialty: 'otology', moduleId: null, priority: 1, difficultyBand: 'core', keywords: ['cholesteatoma', 'chronic om', 'tympanic membrane', 'mastoid', 'retraction'] }, // REVIEW
      { id: 'complications-of-otitis-media', label: 'Complications of Otitis Media', subspecialty: 'otology', moduleId: null, priority: 1, difficultyBand: 'core', keywords: ['mastoiditis', 'facial palsy', 'sigmoid sinus', 'intracranial', 'petrositis'] }, // REVIEW
      { id: 'sudden-snhl', label: 'Sudden Sensorineural Hearing Loss', subspecialty: 'otology', moduleId: null, priority: 1, difficultyBand: 'core', keywords: ['sudden snhl', 'steroids', 'audiogram', 'idiopathic', 'intratympanic'] }, // REVIEW
      { id: 'menieres-episodic-vertigo', label: "Ménière's Disease & Episodic Vertigo", subspecialty: 'otology', moduleId: null, priority: 1, difficultyBand: 'core', keywords: ['meniere', 'hydrops', 'vertigo', 'ecog', 'diuretic'] }, // REVIEW
      { id: 'bppv-vestibular-testing', label: 'BPPV & Vestibular Testing', subspecialty: 'otology', moduleId: null, priority: 2, difficultyBand: 'core', keywords: ['bppv', 'dix-hallpike', 'epley', 'vng', 'vestibular'] }, // REVIEW
      { id: 'otosclerosis-stapes', label: 'Otosclerosis & Stapes Surgery', subspecialty: 'otology', moduleId: null, priority: 2, difficultyBand: 'core', keywords: ['otosclerosis', 'stapedectomy', 'conductive', 'carhart', 'footplate'] }, // REVIEW
      { id: 'cochlear-implants', label: 'Cochlear Implants', subspecialty: 'otology', moduleId: null, priority: 2, difficultyBand: 'advanced', keywords: ['cochlear implant', 'candidacy', 'electrode', 'mapping', 'auditory rehab'] }, // REVIEW
      { id: 'temporal-bone-trauma', label: 'Temporal Bone Trauma', subspecialty: 'otology', moduleId: null, priority: 2, difficultyBand: 'core', keywords: ['temporal bone fracture', 'otic capsule', 'facial nerve', 'csf otorrhea', 'trauma'] }, // REVIEW
      { id: 'tympanoplasty-ossiculoplasty', label: 'Tympanoplasty & Ossiculoplasty', subspecialty: 'otology', moduleId: null, priority: 3, difficultyBand: 'core', keywords: ['tympanoplasty', 'ossiculoplasty', 'prosthesis', 'graft', 'perforation'] }, // REVIEW
      { id: 'sscd-third-window', label: 'SSCD & Third Window Syndromes', subspecialty: 'otology', moduleId: null, priority: 3, difficultyBand: 'advanced', keywords: ['sscd', 'third window', 'tullio', 'vemp', 'dehiscence'] }, // REVIEW

      // ═══════════════ RHINOLOGY / ALLERGY ═══════════════
      { id: 'acute-bacterial-rhinosinusitis', label: 'Acute Bacterial Rhinosinusitis', subspecialty: 'rhinology', moduleId: null, priority: 1, difficultyBand: 'foundational', keywords: ['acute sinusitis', 'bacterial', 'antibiotics', 'rhinosinusitis', 'diagnosis'] }, // REVIEW
      { id: 'crs-polyps-afrs-biologics', label: 'CRS, Polyps, AFRS & Biologics', subspecialty: 'rhinology', moduleId: null, priority: 1, difficultyBand: 'core', keywords: ['chronic rhinosinusitis', 'nasal polyps', 'afrs', 'biologics', 'ess'] }, // REVIEW
      { id: 'orbital-intracranial-sinus-complications', label: 'Orbital & Intracranial Complications of Sinusitis', subspecialty: 'rhinology', moduleId: null, priority: 1, difficultyBand: 'core', keywords: ['orbital cellulitis', 'subperiosteal abscess', 'pott puffy', 'chandler', 'intracranial'] }, // REVIEW
      { id: 'epistaxis-hht', label: 'Epistaxis & HHT', subspecialty: 'rhinology', moduleId: null, priority: 1, difficultyBand: 'foundational', keywords: ['epistaxis', 'sphenopalatine', 'hht', 'kiesselbach', 'packing'] }, // REVIEW
      { id: 'allergic-rhinitis-immunotherapy', label: 'Allergic Rhinitis & Immunotherapy', subspecialty: 'rhinology', moduleId: null, priority: 2, difficultyBand: 'core', keywords: ['allergic rhinitis', 'immunotherapy', 'ige', 'allergy testing', 'antihistamine'] }, // REVIEW
      { id: 'sinonasal-tumors', label: 'Sinonasal Tumors', subspecialty: 'rhinology', moduleId: null, priority: 2, difficultyBand: 'advanced', keywords: ['inverted papilloma', 'esthesioneuroblastoma', 'sinonasal', 'sccr', 'staging'] }, // REVIEW
      { id: 'csf-rhinorrhea-encephalocele', label: 'CSF Rhinorrhea & Encephalocele', subspecialty: 'rhinology', moduleId: null, priority: 2, difficultyBand: 'advanced', keywords: ['csf leak', 'rhinorrhea', 'encephalocele', 'beta-2 transferrin', 'skull base repair'] }, // REVIEW
      { id: 'anterior-skull-base-pituitary', label: 'Anterior Skull Base & Pituitary', subspecialty: 'rhinology', moduleId: null, priority: 3, difficultyBand: 'advanced', keywords: ['skull base', 'pituitary', 'endoscopic', 'sella', 'nasoseptal flap'] }, // REVIEW

      // ═══════════════ LARYNGOLOGY / BRONCHOESOPHAGOLOGY ═══════════════
      { id: 'benign-vocal-fold-lesions', label: 'Benign Vocal Fold Lesions', subspecialty: 'laryngology', moduleId: null, priority: 1, difficultyBand: 'core', keywords: ['nodules', 'polyps', 'cysts', 'vocal fold', 'phonomicrosurgery'] }, // REVIEW
      { id: 'vocal-fold-paralysis', label: 'Vocal Fold Paralysis', subspecialty: 'laryngology', moduleId: null, priority: 1, difficultyBand: 'core', keywords: ['vocal fold paralysis', 'rln', 'medialization', 'injection', 'thyroplasty'] }, // REVIEW
      { id: 'laryngotracheal-stenosis', label: 'Laryngotracheal Stenosis', subspecialty: 'laryngology', moduleId: null, priority: 2, difficultyBand: 'advanced', keywords: ['subglottic stenosis', 'tracheal stenosis', 'cotton-myer', 'dilation', 'resection'] }, // REVIEW
      { id: 'zenker-cricopharyngeal-dysphagia', label: 'Zenker & Cricopharyngeal Dysphagia', subspecialty: 'laryngology', moduleId: null, priority: 2, difficultyBand: 'core', keywords: ['zenker diverticulum', 'cricopharyngeal', 'dysphagia', 'myotomy', 'diverticulotomy'] }, // REVIEW
      { id: 'lpr-chronic-cough', label: 'LPR & Chronic Cough', subspecialty: 'laryngology', moduleId: null, priority: 3, difficultyBand: 'foundational', keywords: ['lpr', 'reflux', 'chronic cough', 'ppi', 'rsi'] }, // REVIEW
      { id: 'spasmodic-dysphonia-neurolaryngology', label: 'Spasmodic Dysphonia & Neurolaryngology', subspecialty: 'laryngology', moduleId: null, priority: 3, difficultyBand: 'advanced', keywords: ['spasmodic dysphonia', 'botox', 'neurolaryngology', 'tremor', 'dystonia'] }, // REVIEW
      { id: 'esophagology-caustic-ingestion', label: 'Esophagology & Caustic Ingestion', subspecialty: 'laryngology', moduleId: null, priority: 3, difficultyBand: 'core', keywords: ['caustic ingestion', 'esophagoscopy', 'stricture', 'foreign body', 'esophagology'] }, // REVIEW

      // ═══════════════ HEAD & NECK ONCOLOGY ═══════════════
      { id: 'oral-cavity-cancer', label: 'Oral Cavity Cancer', subspecialty: 'hn_onc', moduleId: null, priority: 1, difficultyBand: 'core', keywords: ['oral cavity', 'tongue', 'scc', 'doi', 'staging'] }, // REVIEW
      { id: 'oropharynx-hpv', label: 'Oropharyngeal Cancer & HPV', subspecialty: 'hn_onc', moduleId: null, priority: 1, difficultyBand: 'core', keywords: ['oropharynx', 'hpv', 'p16', 'tonsil', 'tors'] }, // REVIEW
      { id: 'laryngeal-cancer', label: 'Laryngeal Cancer', subspecialty: 'hn_onc', moduleId: null, priority: 1, difficultyBand: 'core', keywords: ['laryngeal cancer', 'glottic', 'supraglottic', 'organ preservation', 'laryngectomy'] }, // REVIEW
      { id: 'salivary-gland-neoplasms', label: 'Salivary Gland Neoplasms', subspecialty: 'hn_onc', moduleId: null, priority: 1, difficultyBand: 'core', keywords: ['parotid', 'pleomorphic adenoma', 'mucoepidermoid', 'facial nerve', 'fna'] }, // REVIEW
      { id: 'neck-dissection-unknown-primary', label: 'Neck Dissection & Unknown Primary', subspecialty: 'hn_onc', moduleId: null, priority: 1, difficultyBand: 'core', keywords: ['neck dissection', 'nodal levels', 'unknown primary', 'metastasis', 'sentinel'] }, // REVIEW
      { id: 'cutaneous-scc-melanoma', label: 'Cutaneous SCC & Melanoma', subspecialty: 'hn_onc', moduleId: null, priority: 2, difficultyBand: 'core', keywords: ['cutaneous scc', 'melanoma', 'skin cancer', 'breslow', 'parotid nodes'] }, // REVIEW
      { id: 'nasopharyngeal-carcinoma', label: 'Nasopharyngeal Carcinoma', subspecialty: 'hn_onc', moduleId: null, priority: 2, difficultyBand: 'advanced', keywords: ['nasopharyngeal carcinoma', 'ebv', 'chemoradiation', 'npc', 'staging'] }, // REVIEW
      { id: 'hypopharynx-cervical-esophagus', label: 'Hypopharynx & Cervical Esophagus', subspecialty: 'hn_onc', moduleId: null, priority: 3, difficultyBand: 'advanced', keywords: ['hypopharynx', 'pyriform sinus', 'cervical esophagus', 'reconstruction', 'staging'] }, // REVIEW
      { id: 'paraganglioma-vascular', label: 'Paraganglioma & Vascular Tumors', subspecialty: 'hn_onc', moduleId: null, priority: 3, difficultyBand: 'advanced', keywords: ['paraganglioma', 'glomus', 'sdhx', 'embolization', 'carotid body'] }, // REVIEW
      { id: 'radiation-systemic-principles', label: 'Radiation & Systemic Therapy Principles', subspecialty: 'hn_onc', moduleId: null, priority: 2, difficultyBand: 'core', keywords: ['radiation therapy', 'chemotherapy', 'cisplatin', 'imrt', 'toxicity'] }, // REVIEW

      // ═══════════════ FACIAL PLASTICS & RECON ═══════════════
      { id: 'facial-reanimation', label: 'Facial Reanimation', subspecialty: 'fprs', moduleId: 'facial-reanimation', priority: 1, difficultyBand: 'core', keywords: ['facial nerve', 'synkinesis', 'house-brackmann', 'nerve transfer', 'gracilis'] }, // REVIEW
      { id: 'facial-trauma-mandible-midface', label: 'Facial Trauma: Mandible & Midface', subspecialty: 'fprs', moduleId: null, priority: 1, difficultyBand: 'core', keywords: ['facial fractures', 'mandible', 'le fort', 'orbital floor', 'orif'] }, // REVIEW
      { id: 'local-flaps-mohs-reconstruction', label: 'Local Flaps & Mohs Reconstruction', subspecialty: 'fprs', moduleId: null, priority: 1, difficultyBand: 'core', keywords: ['local flaps', 'mohs', 'reconstruction', 'rotation flap', 'skin defect'] }, // REVIEW
      { id: 'rhinoplasty-nasal-analysis', label: 'Rhinoplasty & Nasal Analysis', subspecialty: 'fprs', moduleId: null, priority: 2, difficultyBand: 'core', keywords: ['rhinoplasty', 'nasal analysis', 'tip', 'grafts', 'aesthetics'] }, // REVIEW
      { id: 'free-tissue-transfer', label: 'Free Tissue Transfer', subspecialty: 'fprs', moduleId: null, priority: 2, difficultyBand: 'advanced', keywords: ['free flap', 'radial forearm', 'fibula', 'microvascular', 'reconstruction'] }, // REVIEW
      { id: 'otoplasty-microtia', label: 'Otoplasty & Microtia', subspecialty: 'fprs', moduleId: null, priority: 3, difficultyBand: 'advanced', keywords: ['otoplasty', 'microtia', 'auricular reconstruction', 'prominent ear', 'costal cartilage'] }, // REVIEW
      { id: 'aging-face-blepharoplasty', label: 'Aging Face & Blepharoplasty', subspecialty: 'fprs', moduleId: null, priority: 3, difficultyBand: 'core', keywords: ['facelift', 'blepharoplasty', 'aging face', 'brow lift', 'rhytidectomy'] }, // REVIEW

      // ═══════════════ PEDIATRIC OTOLARYNGOLOGY ═══════════════
      { id: 'pediatric-hearing-loss', label: 'Pediatric Hearing Loss', subspecialty: 'pediatrics', moduleId: 'pediatrics', priority: 1, difficultyBand: 'core', keywords: ['pediatric hearing loss', 'ehdi', 'gjb2', 'ccmv', 'syndromic'] }, // REVIEW
      { id: 'tubes-tonsils-neck', label: 'Tubes, Tonsils & Neck', subspecialty: 'pediatrics', moduleId: 'ta-tubes', priority: 1, difficultyBand: 'core', keywords: ['ear tubes', 'tonsillectomy', 'adenoidectomy', 'ome', 'neck node'] }, // REVIEW
      { id: 'pediatric-airway', label: 'Pediatric Airway', subspecialty: 'pediatrics', moduleId: null, priority: 1, difficultyBand: 'core', keywords: ['laryngomalacia', 'subglottic stenosis', 'stridor', 'pediatric airway', 'bronchoscopy'] }, // REVIEW
      { id: 'congenital-neck-masses-vascular-anomalies', label: 'Congenital Neck Masses & Vascular Anomalies', subspecialty: 'pediatrics', moduleId: null, priority: 1, difficultyBand: 'core', keywords: ['branchial cleft', 'thyroglossal duct', 'lymphatic malformation', 'hemangioma', 'neck mass'] }, // REVIEW
      { id: 'airway-foreign-bodies-caustics', label: 'Airway Foreign Bodies & Caustics', subspecialty: 'pediatrics', moduleId: null, priority: 1, difficultyBand: 'core', keywords: ['foreign body', 'aspiration', 'bronchoscopy', 'caustic', 'airway'] }, // REVIEW
      { id: 'choanal-atresia-craniofacial-syndromes', label: 'Choanal Atresia & Craniofacial Syndromes', subspecialty: 'pediatrics', moduleId: null, priority: 2, difficultyBand: 'core', keywords: ['choanal atresia', 'charge', 'craniofacial', 'pierre robin', 'syndrome'] }, // REVIEW
      { id: 'pediatric-sinusitis-periorbital', label: 'Pediatric Sinusitis & Periorbital Infection', subspecialty: 'pediatrics', moduleId: null, priority: 2, difficultyBand: 'foundational', keywords: ['pediatric sinusitis', 'periorbital cellulitis', 'orbital abscess', 'chandler', 'complications'] }, // REVIEW
      { id: 'velopharyngeal-insufficiency-drooling', label: 'Velopharyngeal Insufficiency & Drooling', subspecialty: 'pediatrics', moduleId: null, priority: 3, difficultyBand: 'advanced', keywords: ['vpi', 'cleft palate', 'drooling', 'nasoendoscopy', 'sialorrhea'] }, // REVIEW

      // ═══════════════ SLEEP MEDICINE ═══════════════
      { id: 'adult-osa-evaluation', label: 'Adult OSA Evaluation', subspecialty: 'sleep', moduleId: null, priority: 1, difficultyBand: 'core', keywords: ['osa', 'polysomnography', 'ahi', 'dise', 'cpap'] }, // REVIEW
      { id: 'sleep-surgery-hgns', label: 'Sleep Surgery & Hypoglossal Nerve Stimulation', subspecialty: 'sleep', moduleId: null, priority: 2, difficultyBand: 'advanced', keywords: ['sleep surgery', 'hgns', 'uppp', 'inspire', 'maxillomandibular'] }, // REVIEW
      { id: 'pediatric-osa', label: 'Pediatric OSA', subspecialty: 'sleep', moduleId: null, priority: 2, difficultyBand: 'core', keywords: ['pediatric osa', 'adenotonsillar', 'sdb', 'polysomnography', 'tonsillectomy'] }, // REVIEW

      // ═══════════════ ENDOCRINE ═══════════════
      { id: 'dtc-risk-stratification', label: 'Thyroid Cancer Risk Stratification', subspecialty: 'endocrine', moduleId: 'dtc-risk-stratification', priority: 1, difficultyBand: 'core', keywords: ['thyroid cancer', 'ata', 'risk stratification', 'staging', 'completion'] }, // REVIEW
      { id: 'thyroid-nodule-bethesda-molecular', label: 'Thyroid Nodule: Bethesda & Molecular Testing', subspecialty: 'endocrine', moduleId: null, priority: 1, difficultyBand: 'core', keywords: ['thyroid nodule', 'bethesda', 'fna', 'molecular testing', 'ti-rads'] }, // REVIEW
      { id: 'hyperparathyroidism', label: 'Hyperparathyroidism', subspecialty: 'endocrine', moduleId: null, priority: 1, difficultyBand: 'core', keywords: ['hyperparathyroidism', 'pth', 'sestamibi', 'parathyroidectomy', 'calcium'] }, // REVIEW
      { id: 'medullary-anaplastic-familial', label: 'Medullary, Anaplastic & Familial Thyroid Cancer', subspecialty: 'endocrine', moduleId: null, priority: 2, difficultyBand: 'advanced', keywords: ['medullary', 'anaplastic', 'ret', 'men2', 'calcitonin'] }, // REVIEW

      // ═══════════════ FUNDAMENTALS / ANATOMY ═══════════════
      { id: 'head-neck-spaces-deep-neck-infections', label: 'Head & Neck Spaces & Deep Neck Infections', subspecialty: 'fundamentals', moduleId: null, priority: 1, difficultyBand: 'foundational', keywords: ['deep neck space', 'parapharyngeal', 'ludwig', 'abscess', 'fascial planes'] }, // REVIEW
      { id: 'imaging-radiology-principles', label: 'Imaging & Radiology Principles', subspecialty: 'fundamentals', moduleId: null, priority: 2, difficultyBand: 'foundational', keywords: ['ct', 'mri', 'imaging', 'radiology', 'contrast'] }, // REVIEW
      { id: 'airway-management-anesthesia', label: 'Airway Management & Anesthesia', subspecialty: 'fundamentals', moduleId: null, priority: 2, difficultyBand: 'core', keywords: ['airway management', 'intubation', 'tracheostomy', 'anesthesia', 'difficult airway'] }, // REVIEW
      { id: 'hemostasis-transfusion-periop', label: 'Hemostasis, Transfusion & Perioperative Care', subspecialty: 'fundamentals', moduleId: null, priority: 2, difficultyBand: 'foundational', keywords: ['hemostasis', 'transfusion', 'coagulation', 'perioperative', 'anticoagulation'] }, // REVIEW
      { id: 'antimicrobials-pharmacology', label: 'Antimicrobials & Pharmacology', subspecialty: 'fundamentals', moduleId: null, priority: 3, difficultyBand: 'foundational', keywords: ['antibiotics', 'antimicrobials', 'pharmacology', 'prophylaxis', 'resistance'] }, // REVIEW
      { id: 'biostatistics-evidence', label: 'Biostatistics & Evidence-Based Medicine', subspecialty: 'fundamentals', moduleId: null, priority: 3, difficultyBand: 'foundational', keywords: ['biostatistics', 'sensitivity', 'specificity', 'evidence-based', 'study design'] }, // REVIEW

    ],
  };
})();
