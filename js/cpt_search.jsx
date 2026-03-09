const { useState, useEffect, useRef } = React;
const { Search, Copy, Clock, TrendingUp, X } = LucideReact;

const CPTSearchTool = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [topSearches, setTopSearches] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const searchInputRef = useRef(null);

  // Complete CPT code database
  const cptDatabase = [
    // Airway
    { code: '31300', desc: 'Laryngotomy (thyrotomy, laryngofissure), with removal of tumor or laryngocele, cordectomy', area: 'Head & Neck - Larynx/Trachea', type: 'Partial laryngectomy, external or endoscopic', keyInd: 'Air' },
    { code: '31420', desc: 'Epiglottidectomy', area: 'Head & Neck - Larynx/Trachea', type: 'Partial laryngectomy, external or endoscopic', keyInd: 'Air' },
    { code: '31527', desc: 'Laryngoscopy direct, with or without tracheoscopy; with insertion of obturator', area: 'General/Peds - Endoscopy', type: 'Rigid laryngoscopy & intervention', keyInd: 'Air' },
    { code: '31528', desc: 'Laryngoscopy direct, with or without tracheoscopy; with dilation, initial', area: 'General/Peds - Endoscopy', type: 'Rigid laryngoscopy & intervention', keyInd: 'Air' },
    { code: '31530', desc: 'Laryngoscopy, direct, operative, with foreign body removal', area: 'General/Peds - Endoscopy', type: 'Rigid laryngoscopy & intervention', keyInd: 'Air' },
    { code: '31531', desc: 'Laryngoscopy, direct, operative, with foreign body removal; with operating microscope or telescope', area: 'General/Peds - Endoscopy', type: 'Rigid laryngoscopy & intervention', keyInd: 'Air' },
    { code: '31540', desc: 'Laryngoscopy, direct, operative, with excision of tumor and/or stripping of vocal cords or epiglottis', area: 'General/Peds - Endoscopy', type: 'Rigid laryngoscopy & intervention', keyInd: 'Air' },
    { code: '31541', desc: 'Laryngoscopy, direct, operative, with excision of tumor and/or stripping of vocal cords or epiglottis; with operating microscope or telescope', area: 'General/Peds - Endoscopy', type: 'Rigid laryngoscopy & intervention', keyInd: 'Air' },
    { code: '31545', desc: 'Laryngoscopy, direct, operative, with operating microscope or telescope, with submucosal removal of non-neoplastic lesion(s) of vocal cord; reconstruction with local tissue flap(s)', area: 'General/Peds - Endoscopy', type: 'Rigid laryngoscopy & intervention', keyInd: 'Air' },
    { code: '31551', desc: 'Laryngoplasty; for laryngeal stenosis, with graft, without indwelling stent placement, younger than 12 years of age', area: 'General/Peds - Larynx', type: 'Laryngoplasty', keyInd: 'Air' },
    { code: '31552', desc: 'Laryngoplasty; for laryngeal stenosis, with graft, without indwelling stent placement, age 12 years or older', area: 'General/Peds - Larynx', type: 'Laryngoplasty', keyInd: 'Air' },
    { code: '31553', desc: 'Laryngoplasty; for laryngeal stenosis, with graft, with indwelling stent placement, younger than 12 years of age', area: 'General/Peds - Larynx', type: 'Laryngoplasty', keyInd: 'Air' },
    { code: '31554', desc: 'Laryngoplasty; for laryngeal stenosis, with graft, with indwelling stent placement, age 12 years or older', area: 'General/Peds - Larynx', type: 'Laryngoplasty', keyInd: 'Air' },
    { code: '31560', desc: 'Laryngoscopy, direct, operative, with arytenoidectomy', area: 'General/Peds - Endoscopy', type: 'Rigid laryngoscopy & intervention', keyInd: 'Air' },
    { code: '31561', desc: 'Laryngoscopy, direct, operative, with arytenoidectomy; with operating microscope or telescope', area: 'General/Peds - Endoscopy', type: 'Rigid laryngoscopy & intervention', keyInd: 'Air' },
    { code: '31570', desc: 'Laryngoscopy, direct, with injection into vocal cord(s), therapeutic', area: 'General/Peds - Endoscopy', type: 'Rigid laryngoscopy & intervention', keyInd: 'Air' },
    { code: '31571', desc: 'Laryngoscopy, direct, with injection into vocal cord(s), therapeutic; with operating microscope or telescope', area: 'General/Peds - Endoscopy', type: 'Rigid laryngoscopy & intervention', keyInd: 'Air' },
    { code: '31572', desc: 'Laryngoscopy, flexible; with ablation or destruction of lesion(s) with laser, unilateral', area: 'General/Peds - Endoscopy', type: 'Flex laryngoscopy w/wo intervention', keyInd: 'Air' },
    { code: '31573', desc: 'Laryngoscopy, flexible; with therapeutic injection(s) (eg, chemodenervation agent or corticosteroid, injected percutaneous, transoral, or via endoscope channel), unilateral', area: 'General/Peds - Endoscopy', type: 'Flex laryngoscopy w/wo intervention', keyInd: 'Air' },
    { code: '31574', desc: 'Laryngoscopy, flexible; with injection(s) for augmentation (eg, percutaneous, transoral), unilateral', area: 'General/Peds - Endoscopy', type: 'Flex laryngoscopy w/wo intervention', keyInd: 'Air' },
    { code: '31576', desc: 'Laryngoscopy, flexible; with biopsy(ies)', area: 'General/Peds - Endoscopy', type: 'Flex laryngoscopy w/wo intervention', keyInd: 'Air' },
    { code: '31577', desc: 'Laryngoscopy, flexible; with removal of foreign body(s)', area: 'General/Peds - Endoscopy', type: 'Flex laryngoscopy w/wo intervention', keyInd: 'Air' },
    { code: '31578', desc: 'Laryngoscopy, flexible; with removal of lesion(s), non-laser', area: 'General/Peds - Endoscopy', type: 'Flex laryngoscopy w/wo intervention', keyInd: 'Air' },
    { code: '31580', desc: 'Laryngoplasty; for laryngeal web, with indwelling keel or stent insertion', area: 'General/Peds - Larynx', type: 'Laryngoplasty', keyInd: 'Air' },
    { code: '31584', desc: 'Laryngoplasty; with open reduction and fixation of (eg, plating) fracture, includes tracheostomy, if performed', area: 'General/Peds - Larynx', type: 'Laryngeal fracture', keyInd: 'Air' },
    { code: '31587', desc: 'Laryngoplasty, cricoid split, without graft placement', area: 'General/Peds - Larynx', type: 'Laryngoplasty', keyInd: 'Air' },
    { code: '31591', desc: 'Laryngoplasty, medialization, unilateral', area: 'General/Peds - Larynx', type: 'Laryngoplasty', keyInd: 'Air' },
    { code: '31592', desc: 'Cricotracheal resection', area: 'Head & Neck - Larynx/Trachea', type: 'Trachea', keyInd: 'Air' },
    { code: '31780', desc: 'Excision tracheal stenosis and anastomosis; cervical', area: 'Head & Neck - Larynx/Trachea', type: 'Trachea', keyInd: 'Air' },
    
    // Bronchoscopy
    { code: '31615', desc: 'Tracheobronchoscopy through established tracheostomy incision', area: 'General/Peds - Endoscopy', type: 'Bronchoscopy w/wo intervention', keyInd: 'Bron' },
    { code: '31622', desc: 'Bronchoscopy, rigid or flexible, including fluoroscopic guidance, when performed; diagnostic, with cell washing, when performed (separate procedure)', area: 'General/Peds - Endoscopy', type: 'Bronchoscopy w/wo intervention', keyInd: 'Bron' },
    { code: '31623', desc: 'Bronchoscopy, rigid or flexible, including fluoroscopic guidance, when performed; with brushing or protected brushings', area: 'General/Peds - Endoscopy', type: 'Bronchoscopy w/wo intervention', keyInd: 'Bron' },
    { code: '31624', desc: 'Bronchoscopy, rigid or flexible, including fluoroscopic guidance, when performed; with bronchial alveolar lavage', area: 'General/Peds - Endoscopy', type: 'Bronchoscopy w/wo intervention', keyInd: 'Bron' },
    { code: '31625', desc: 'Bronchoscopy, rigid or flexible, including fluoroscopic guidance, when performed; with bronchial or endobronchial biopsy(s), single or multiple sites', area: 'General/Peds - Endoscopy', type: 'Bronchoscopy w/wo intervention', keyInd: 'Bron' },
    { code: '31630', desc: 'Bronchoscopy, rigid or flexible, including fluoroscopic guidance, when performed; with tracheal/bronchial dilation or closed reduction of fracture', area: 'General/Peds - Endoscopy', type: 'Bronchoscopy w/wo intervention', keyInd: 'Bron' },
    { code: '31631', desc: 'Bronchoscopy, rigid or flexible, including fluoroscopic guidance, when performed; with placement of tracheal stent(s) (includes tracheal/bronchial dilation as required)', area: 'General/Peds - Endoscopy', type: 'Bronchoscopy w/wo intervention', keyInd: 'Bron' },
    { code: '31635', desc: 'Bronchoscopy, rigid or flexible, including fluoroscopic guidance, when performed; with removal of foreign body', area: 'General/Peds - Endoscopy', type: 'Bronchoscopy w/wo intervention', keyInd: 'Bron' },
    { code: '31636', desc: 'Bronchoscopy, rigid or flexible, including fluoroscopic guidance, when performed; with placement of bronchial stent(s) (includes tracheal/bronchial dilation as required), initial bronchus', area: 'General/Peds - Endoscopy', type: 'Bronchoscopy w/wo intervention', keyInd: 'Bron' },
    { code: '31638', desc: 'Bronchoscopy, rigid or flexible, including fluoroscopic guidance, when performed; with revision of tracheal or bronchial stent inserted at previous session (includes tracheal/bronchial dilation as required)', area: 'General/Peds - Endoscopy', type: 'Bronchoscopy w/wo intervention', keyInd: 'Bron' },
    { code: '31640', desc: 'Bronchoscopy, rigid or flexible, including fluoroscopic guidance, when performed; with excision of tumor', area: 'General/Peds - Endoscopy', type: 'Bronchoscopy w/wo intervention', keyInd: 'Bron' },
    { code: '31641', desc: 'Bronchoscopy, rigid or flexible, including fluoroscopic guidance, when performed; with destruction of tumor or relief of stenosis by any method other than excision (eg, laser therapy, cryotherapy)', area: 'General/Peds - Endoscopy', type: 'Bronchoscopy w/wo intervention', keyInd: 'Bron' },
    
    // CMF
    { code: '21110', desc: 'Application of interdental fixation device for conditions other than fracture or dislocation, includes removal', area: 'Plastic/Trauma', type: 'Mandible fracture', keyInd: 'CMF' },
    { code: '21343', desc: 'Open treatment of depressed frontal sinus fracture', area: 'Plastic/Trauma', type: 'Frontal sinus fracture', keyInd: 'CMF' },
    { code: '21344', desc: 'Open treatment of complicated (eg, comminuted or involving posterior wall) frontal sinus fracture, via coronal or multiple approaches', area: 'Plastic/Trauma', type: 'Frontal sinus fracture', keyInd: 'CMF' },
    { code: '21345', desc: 'Closed treatment of nasomaxillary complex fracture (LeFort II type), with interdental wire fixation or fixation of denture or splint', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21346', desc: 'Open treatment of nasomaxillary complex fracture (LeFort II type); with wiring and/or local fixation', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21347', desc: 'Open treatment of nasomaxillary complex fracture (LeFort II type); requiring multiple open approaches', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21348', desc: 'Open treatment of nasomaxillary complex fracture (LeFort II type); with bone grafting (includes obtaining graft)', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21355', desc: 'Percutaneous treatment of fracture of malar area, including zygomatic arch and malar tripod, with manipulation', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21356', desc: 'Open treatment of depressed zygomatic arch fracture (eg, Gillies approach)', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21360', desc: 'Open treatment of depressed malar fracture, including zygomatic arch and malar tripod', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21365', desc: 'Open treatment of complicated (eg, comminuted or involving cranial nerve foramina) fracture(s) of malar area, including zygomatic arch and malar tripod; with internal fixation and multiple surgical approaches', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21366', desc: 'Open treatment of complicated (eg, comminuted or involving cranial nerve foramina) fracture(s) of malar area, including zygomatic arch and malar tripod; with bone grafting (includes obtaining graft)', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21385', desc: 'Open treatment of orbital floor blowout fracture; transantral approach (Caldwell-Luc type operation)', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21386', desc: 'Open treatment of orbital floor blowout fracture; periorbital approach', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21387', desc: 'Open treatment of orbital floor blowout fracture; combined approach', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21390', desc: 'Open treatment of orbital floor blowout fracture; periorbital approach, with alloplastic or other implant', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21395', desc: 'Open treatment of orbital floor blowout fracture; periorbital approach with bone graft (includes obtaining graft)', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21401', desc: 'Closed treatment of fracture of orbit, except blowout; with manipulation', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21406', desc: 'Open treatment of fracture of orbit, except blowout; without implant', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21407', desc: 'Open treatment of fracture of orbit, except blowout; with implant', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21408', desc: 'Open treatment of fracture of orbit, except blowout; with bone grafting (includes obtaining graft)', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21421', desc: 'Closed treatment of palatal or maxillary fracture (LeFort I type), with interdental wire fixation or fixation of denture or splint', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21422', desc: 'Open treatment of palatal or maxillary fracture (LeFort I type)', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21423', desc: 'Open treatment of palatal or maxillary fracture (LeFort I type); complicated (comminuted or involving cranial nerve foramina), multiple approaches', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21431', desc: 'Closed treatment of craniofacial separation (LeFort III type) using interdental wire fixation of denture or splint', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21432', desc: 'Open treatment of craniofacial separation (LeFort III type); with wiring and/or internal fixation', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21433', desc: 'Open treatment of craniofacial separation (LeFort III type); complicated (eg, comminuted or involving cranial nerve foramina), multiple surgical approaches', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21435', desc: 'Open treatment of craniofacial separation (LeFort III type); complicated, utilizing internal and/or external fixation techniques (eg, head cap, halo device, and/or intermaxillary fixation)', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21436', desc: 'Open treatment of craniofacial separation (LeFort III type); complicated, multiple surgical approaches, internal fixation, with bone grafting (includes obtaining graft)', area: 'Plastic/Trauma', type: 'Midface fracture', keyInd: 'CMF' },
    { code: '21440', desc: 'Closed treatment of mandibular or maxillary alveolar ridge fracture (separate procedure)', area: 'Plastic/Trauma', type: 'Mandible fracture', keyInd: 'CMF' },
    { code: '21445', desc: 'Open treatment of mandibular or maxillary alveolar ridge fracture (separate procedure)', area: 'Plastic/Trauma', type: 'Mandible fracture', keyInd: 'CMF' },
    { code: '21451', desc: 'Closed treatment of mandibular fracture; with manipulation', area: 'Plastic/Trauma', type: 'Mandible fracture', keyInd: 'CMF' },
    { code: '21452', desc: 'Percutaneous treatment of mandibular fracture, with external fixation', area: 'Plastic/Trauma', type: 'Mandible fracture', keyInd: 'CMF' },
    { code: '21453', desc: 'Closed treatment of mandibular fracture with interdental fixation', area: 'Plastic/Trauma', type: 'Mandible fracture', keyInd: 'CMF' },
    { code: '21454', desc: 'Open treatment of mandibular fracture with external fixation', area: 'Plastic/Trauma', type: 'Mandible fracture', keyInd: 'CMF' },
    { code: '21461', desc: 'Open treatment of mandibular fracture; without interdental fixation', area: 'Plastic/Trauma', type: 'Mandible fracture', keyInd: 'CMF' },
    { code: '21462', desc: 'Open treatment of mandibular fracture; with interdental fixation', area: 'Plastic/Trauma', type: 'Mandible fracture', keyInd: 'CMF' },
    { code: '21465', desc: 'Open treatment of mandibular condylar fracture', area: 'Plastic/Trauma', type: 'Mandible fracture', keyInd: 'CMF' },
    { code: '21470', desc: 'Open treatment of complicated mandibular fracture by multiple surgical approaches including internal fixation, interdental fixation, and/or wiring of dentures or splints', area: 'Plastic/Trauma', type: 'Mandible fracture', keyInd: 'CMF' },
    { code: '61580', desc: 'Craniofacial approach to anterior cranial fossa; extradural, including lateral rhinotomy, ethmoidectomy, sphenoidectomy, without maxillectomy or orbital exenteration', area: 'Head & Neck - Nose and Maxilla', type: 'Anterior skull base', keyInd: 'CMF' },
    { code: '61581', desc: 'Craniofacial approach to anterior cranial fossa; extradural, including lateral rhinotomy, orbital exenteration, ethmoidectomy, sphenoidectomy and/or maxillectomy', area: 'Head & Neck - Nose and Maxilla', type: 'Anterior skull base', keyInd: 'CMF' },
    { code: '61584', desc: 'Orbitocranial approach to anterior cranial fossa, extradural, including supraorbital ridge osteotomy and elevation of frontal and/or temporal lobe(s); without orbital exenteration', area: 'Head & Neck - Nose and Maxilla', type: 'Anterior skull base', keyInd: 'CMF' },
    { code: '61585', desc: 'Orbitocranial approach to anterior cranial fossa, extradural, including supraorbital ridge osteotomy and elevation of frontal and/or temporal lobe(s); with orbital exenteration', area: 'Head & Neck - Nose and Maxilla', type: 'Anterior skull base', keyInd: 'CMF' },
    { code: '61586', desc: 'Bicoronal, transzygomatic and/or LeFort I osteotomy approach to anterior cranial fossa with or without internal fixation, without bone graft', area: 'Head & Neck - Nose and Maxilla', type: 'Anterior skull base', keyInd: 'CMF' },
    
    // Congenital
    { code: '21720', desc: 'Division of sternocleidomastoid for torticollis, open operation; without cast application', area: 'General/Peds - Congenital Anomalies', type: 'Congenital masses', keyInd: 'CM' },
    { code: '30124', desc: 'Excision dermoid cyst, nose; simple, skin, subcutaneous', area: 'General/Peds - Congenital Anomalies', type: 'Congenital masses', keyInd: 'CM' },
    { code: '30125', desc: 'Excision dermoid cyst, nose; complex, under bone or cartilage', area: 'General/Peds - Congenital Anomalies', type: 'Congenital masses', keyInd: 'CM' },
    { code: '35180', desc: 'Repair, congenital arteriovenous fistula; head and neck', area: 'General/Peds - Congenital Anomalies', type: 'Congenital masses', keyInd: 'CM' },
    { code: '38550', desc: 'Excision of cystic hygroma, axillary or cervical; without deep neurovascular dissection', area: 'General/Peds - Congenital Anomalies', type: 'Congenital masses', keyInd: 'CM' },
    { code: '38555', desc: 'Excision of cystic hygroma, axillary or cervical; with deep neurovascular dissection', area: 'General/Peds - Congenital Anomalies', type: 'Congenital masses', keyInd: 'CM' },
    { code: '42810', desc: 'Excision branchial cleft cyst or vestige, confined to skin and subcutaneous tissues', area: 'General/Peds - Congenital Anomalies', type: 'Congenital masses', keyInd: 'CM' },
    { code: '42815', desc: 'Excision branchial cleft cyst, vestige, or fistula, extending beneath subcutaneous tissues and/or into pharynx', area: 'General/Peds - Congenital Anomalies', type: 'Congenital masses', keyInd: 'CM' },
    { code: '60280', desc: 'Excision of thyroglossal duct cyst or sinus', area: 'General/Peds - Congenital Anomalies', type: 'Congenital masses', keyInd: 'CM' },
    { code: '60281', desc: 'Excision of thyroglossal duct cyst or sinus; recurrent', area: 'General/Peds - Congenital Anomalies', type: 'Congenital masses', keyInd: 'CM' },
    
    // Flaps and Grafts
    { code: '14000', desc: 'Adjacent tissue transfer or rearrangement, trunk; defect 10 sq cm or less', area: 'Plastic/Reconstruction', type: 'Local flap', keyInd: 'Flap' },
    { code: '14001', desc: 'Adjacent tissue transfer or rearrangement, trunk; defect 10.1 sq cm to 30.0 sq cm', area: 'Plastic/Reconstruction', type: 'Local flap', keyInd: 'Flap' },
    { code: '14020', desc: 'Adjacent tissue transfer or rearrangement, scalp, arms and/or legs; defect 10 sq cm or less', area: 'Plastic/Reconstruction', type: 'Local flap', keyInd: 'Flap' },
    { code: '14021', desc: 'Adjacent tissue transfer or rearrangement, scalp, arms and/or legs; defect 10.1 sq cm to 30.0 sq cm', area: 'Plastic/Reconstruction', type: 'Local flap', keyInd: 'Flap' },
    { code: '14040', desc: 'Adjacent tissue transfer or rearrangement, forehead, cheeks, chin, mouth, neck, axillae, genitalia, hands and/or feet; defect 10 sq cm or less', area: 'Plastic/Reconstruction', type: 'Local flap', keyInd: 'Flap' },
    { code: '14041', desc: 'Adjacent tissue transfer or rearrangement, forehead, cheeks, chin, mouth, neck, axillae, genitalia, hands and/or feet; defect 10.1 sq cm to 30.0 sq cm', area: 'Plastic/Reconstruction', type: 'Local flap', keyInd: 'Flap' },
    { code: '14060', desc: 'Adjacent tissue transfer or rearrangement, eyelids, nose, ears and/or lips; defect 10 sq cm or less', area: 'Plastic/Reconstruction', type: 'Local flap', keyInd: 'Flap' },
    { code: '14061', desc: 'Adjacent tissue transfer or rearrangement, eyelids, nose, ears and/or lips; defect 10.1 sq cm to 30.0 sq cm', area: 'Plastic/Reconstruction', type: 'Local flap', keyInd: 'Flap' },
    { code: '14301', desc: 'Adjacent tissue transfer or rearrangement, any area; defect 30.1 sq cm to 60.0 sq cm', area: 'Plastic/Reconstruction', type: 'Local flap', keyInd: 'Flap' },
    { code: '14302', desc: 'Adjacent tissue transfer or rearrangement, any area; each additional 30.0 sq cm, or part thereof (List separately in addition to code for primary procedure)', area: 'Plastic/Reconstruction', type: 'Local flap', keyInd: 'Flap' },
    { code: '15572', desc: 'Formation of direct or tubed pedicle, with or without transfer; scalp, arms, or legs', area: 'Plastic/Reconstruction', type: 'Pedicled flap', keyInd: 'Flap' },
    { code: '15574', desc: 'Formation of direct or tubed pedicle, with or without transfer; forehead, cheeks, chin, mouth, neck, axillae, genitalia, hands or feet', area: 'Plastic/Reconstruction', type: 'Pedicled flap', keyInd: 'Flap' },
    { code: '15576', desc: 'Formation of direct or tubed pedicle, with or without transfer; eyelids, nose, ears, lips, or intraoral', area: 'Plastic/Reconstruction', type: 'Pedicled flap', keyInd: 'Flap' },
    { code: '15610', desc: 'Delay of flap or sectioning of flap (division and inset); at scalp, arms, or legs', area: 'Plastic/Reconstruction', type: 'Pedicled flap', keyInd: 'Flap' },
    { code: '15620', desc: 'Delay of flap or sectioning of flap (division and inset); at forehead, cheeks, chin, neck, axillae, genitalia, hands, or feet', area: 'Plastic/Reconstruction', type: 'Pedicled flap', keyInd: 'Flap' },
    { code: '15630', desc: 'Delay of flap or sectioning of flap (division and inset); at eyelids, nose, ears, or lips', area: 'Plastic/Reconstruction', type: 'Pedicled flap', keyInd: 'Flap' },
    { code: '15731', desc: 'Forehead flap with preservation of vascular pedicle (eg, axial pattern flap, paramedian forehead flap)', area: 'Plastic/Reconstruction', type: 'Pedicled flap', keyInd: 'Flap' },
    { code: '15734', desc: 'Muscle, myocutaneous, or fasciocutaneous flap; trunk', area: 'Plastic/Reconstruction', type: 'Pedicled flap', keyInd: 'Flap' },
    { code: '15740', desc: 'Flap; island pedicle requiring identification and dissection of an anatomically named axial vessel', area: 'Plastic/Reconstruction', type: 'Pedicled flap', keyInd: 'Flap' },
    { code: '15756', desc: 'Free muscle or myocutaneous flap with microvascular anastomosis', area: 'Plastic/Reconstruction', type: 'Free microvascular flap', keyInd: 'Flap' },
    { code: '15757', desc: 'Free skin flap with microvascular anastomosis', area: 'Plastic/Reconstruction', type: 'Free microvascular flap', keyInd: 'Flap' },
    { code: '15758', desc: 'Free fascial flap with microvascular anastomosis', area: 'Plastic/Reconstruction', type: 'Free microvascular flap', keyInd: 'Flap' },
    { code: '15760', desc: 'Graft; composite (eg, full thickness of external ear or nasal ala), including primary closure, donor area', area: 'Plastic/Reconstruction', type: 'Non-skin graft (cartilage, nerve, composite)', keyInd: 'Flap' },
    { code: '15770', desc: 'Graft; derma-fat-fascia', area: 'Plastic/Reconstruction', type: 'Non-skin graft (cartilage, nerve, composite)', keyInd: 'Flap' },
    { code: '15840', desc: 'Graft for facial nerve paralysis; free fascia graft (including obtaining fascia)', area: 'Plastic/Reconstruction', type: 'Static sling - muscle transfer', keyInd: 'Flap' },
    { code: '15841', desc: 'Graft for facial nerve paralysis; free muscle graft (including obtaining graft)', area: 'Plastic/Reconstruction', type: 'Static sling - muscle transfer', keyInd: 'Flap' },
    { code: '15842', desc: 'Graft for facial nerve paralysis; free muscle flap by microsurgical technique', area: 'Plastic/Reconstruction', type: 'Static sling - muscle transfer', keyInd: 'Flap' },
    { code: '15845', desc: 'Graft for facial nerve paralysis; regional muscle transfer', area: 'Plastic/Reconstruction', type: 'Static sling - muscle transfer', keyInd: 'Flap' },
    { code: '20902', desc: 'Bone graft, any donor area; major or large', area: 'Plastic/Reconstruction', type: 'Non-skin graft (cartilage, nerve, composite)', keyInd: 'Flap' },
    { code: '20910', desc: 'Cartilage graft; costochondral', area: 'Plastic/Reconstruction', type: 'Non-skin graft (cartilage, nerve, composite)', keyInd: 'Flap' },
    { code: '20912', desc: 'Cartilage graft; nasal septum', area: 'Plastic/Reconstruction', type: 'Non-skin graft (cartilage, nerve, composite)', keyInd: 'Flap' },
    { code: '20922', desc: 'Fascia lata graft; by incision and area exposure, complex or sheet', area: 'Plastic/Reconstruction', type: 'Non-skin graft (cartilage, nerve, composite)', keyInd: 'Flap' },
    { code: '20955', desc: 'Bone graft with microvascular anastomosis; fibula', area: 'Plastic/Reconstruction', type: 'Free microvascular flap', keyInd: 'Flap' },
    { code: '20969', desc: 'Free osteocutaneous flap with microvascular anastomosis; other than iliac crest, metatarsal, or great toe', area: 'Plastic/Reconstruction', type: 'Free microvascular flap', keyInd: 'Flap' },
    { code: '20970', desc: 'Free osteocutaneous flap with microvascular anastomosis; iliac crest', area: 'Plastic/Reconstruction', type: 'Free microvascular flap', keyInd: 'Flap' },
    { code: '21210', desc: 'Graft, bone; nasal, maxillary or malar areas (includes obtaining graft)', area: 'Plastic/Reconstruction', type: 'Non-skin graft (cartilage, nerve, composite)', keyInd: 'Flap' },
    { code: '21215', desc: 'Graft, bone; mandible (includes obtaining graft)', area: 'Plastic/Reconstruction', type: 'Non-skin graft (cartilage, nerve, composite)', keyInd: 'Flap' },
    { code: '21230', desc: 'Graft; rib cartilage, autogenous, to face, chin, nose or ear (includes obtaining graft)', area: 'Plastic/Reconstruction', type: 'Non-skin graft (cartilage, nerve, composite)', keyInd: 'Flap' },
    { code: '21235', desc: 'Graft; ear cartilage, autogenous, to nose or ear (includes obtaining graft)', area: 'Plastic/Reconstruction', type: 'Non-skin graft (cartilage, nerve, composite)', keyInd: 'Flap' },
    { code: '40525', desc: 'Excision of lip; full thickness, reconstruction with local flap (eg, Estlander or fan)', area: 'Plastic/Reconstruction', type: 'Local flap', keyInd: 'Flap' },
    { code: '40527', desc: 'Excision of lip; full thickness, reconstruction with cross lip flap (Abbe-Estlander)', area: 'Plastic/Reconstruction', type: 'Pedicled flap', keyInd: 'Flap' },
    { code: '40650', desc: 'Repair lip, full thickness; vermilion only', area: 'Plastic/Reconstruction', type: 'Local flap', keyInd: 'Flap' },
    { code: '40700', desc: 'Plastic repair of cleft lip/nasal deformity; primary, partial or complete, unilateral', area: 'Plastic/Reconstruction', type: 'Cleft repair - lip', keyInd: 'Flap' },
    { code: '40701', desc: 'Plastic repair of cleft lip/nasal deformity; primary bilateral, 1-stage procedure', area: 'Plastic/Reconstruction', type: 'Cleft repair - lip', keyInd: 'Flap' },
    { code: '40702', desc: 'Plastic repair of cleft lip/nasal deformity; primary bilateral, 1 of 2 stages', area: 'Plastic/Reconstruction', type: 'Cleft repair - lip', keyInd: 'Flap' },
    { code: '40720', desc: 'Plastic repair of cleft lip/nasal deformity; secondary, by recreation of defect and reclosure', area: 'Plastic/Reconstruction', type: 'Cleft repair - lip', keyInd: 'Flap' },
    { code: '40761', desc: 'Plastic repair of cleft lip/nasal deformity; with cross lip pedicle flap (Abbe-Estlander type), including sectioning and inserting of pedicle', area: 'Plastic/Reconstruction', type: 'Cleft repair - lip', keyInd: 'Flap' },
    { code: '42200', desc: 'Palatoplasty for cleft palate, soft and/or hard palate only', area: 'Plastic/Reconstruction', type: 'Cleft repair - palate', keyInd: 'Flap' },
    { code: '42205', desc: 'Palatoplasty for cleft palate, with closure of alveolar ridge; soft tissue only', area: 'Plastic/Reconstruction', type: 'Cleft repair - palate', keyInd: 'Flap' },
    { code: '42210', desc: 'Palatoplasty for cleft palate, with closure of alveolar ridge; with bone graft to alveolar ridge (includes obtaining graft)', area: 'Plastic/Reconstruction', type: 'Cleft repair - palate', keyInd: 'Flap' },
    { code: '42215', desc: 'Palatoplasty for cleft palate; major revision', area: 'Plastic/Reconstruction', type: 'Cleft repair - palate', keyInd: 'Flap' },
    { code: '42220', desc: 'Palatoplasty for cleft palate; secondary lengthening procedure', area: 'Plastic/Reconstruction', type: 'Cleft repair - palate', keyInd: 'Flap' },
    { code: '42225', desc: 'Palatoplasty for cleft palate; attachment pharyngeal flap', area: 'Plastic/Reconstruction', type: 'Cleft repair - palate', keyInd: 'Flap' },
    { code: '42226', desc: 'Lengthening of palate, and pharyngeal flap', area: 'Plastic/Reconstruction', type: 'Local flap', keyInd: 'Flap' },
    { code: '42227', desc: 'Lengthening of palate, with island flap', area: 'Plastic/Reconstruction', type: 'Local flap', keyInd: 'Flap' },
    { code: '42235', desc: 'Repair of anterior palate, including vomer flap', area: 'Plastic/Reconstruction', type: 'Local flap', keyInd: 'Flap' },
    { code: '43496', desc: 'Free jejunum transfer with microvascular anastomosis', area: 'Plastic/Reconstruction', type: 'Free microvascular flap', keyInd: 'Flap' },
    
    // Mastoidectomy
    { code: '69501', desc: 'Transmastoid antrotomy (simple mastoidectomy)', area: 'Otology/Middle Ear', type: 'Mastoidectomy', keyInd: 'Mast' },
    { code: '69502', desc: 'Mastoidectomy; complete', area: 'Otology/Middle Ear', type: 'Mastoidectomy', keyInd: 'Mast' },
    { code: '69505', desc: 'Mastoidectomy; modified radical', area: 'Otology/Middle Ear', type: 'Mastoidectomy', keyInd: 'Mast' },
    { code: '69511', desc: 'Mastoidectomy; radical', area: 'Otology/Middle Ear', type: 'Mastoidectomy', keyInd: 'Mast' },
    { code: '69601', desc: 'Revision mastoidectomy; resulting in complete mastoidectomy', area: 'Otology/Middle Ear', type: 'Mastoidectomy', keyInd: 'Mast' },
    { code: '69602', desc: 'Revision mastoidectomy; resulting in modified radical mastoidectomy', area: 'Otology/Middle Ear', type: 'Mastoidectomy', keyInd: 'Mast' },
    { code: '69603', desc: 'Revision mastoidectomy; resulting in radical mastoidectomy', area: 'Otology/Middle Ear', type: 'Mastoidectomy', keyInd: 'Mast' },
    { code: '69670', desc: 'Mastoid obliteration (separate procedure)', area: 'Otology/Middle Ear', type: 'Mastoidectomy', keyInd: 'Mast' },
    
    // Neck Dissection
    { code: '38700', desc: 'Suprahyoid lymphadenectomy', area: 'Head & Neck - Neck', type: 'Neck dissection', keyInd: 'ND' },
    { code: '38720', desc: 'Cervical lymphadenectomy (complete)', area: 'Head & Neck - Neck', type: 'Neck dissection', keyInd: 'ND' },
    { code: '38724', desc: 'Cervical lymphadenectomy (modified radical neck dissection)', area: 'Head & Neck - Neck', type: 'Neck dissection', keyInd: 'ND' },
    { code: '60252', desc: 'Thyroidectomy, total or subtotal for malignancy; with limited neck dissection', area: 'Head & Neck - Neck', type: 'Neck dissection', keyInd: 'ND' },
    
    // Oral Cavity
    { code: '40814', desc: 'Excision of lesion of mucosa and submucosa, vestibule of mouth; with complex repair', area: 'General/Peds - Oral Cavity', type: 'Incision/excision oral cavity', keyInd: 'OC' },
    { code: '41120', desc: 'Glossectomy; less than one-half tongue', area: 'Head & Neck - Oral Cavity', type: 'Glossectomy', keyInd: 'OC' },
    { code: '41130', desc: 'Glossectomy; hemiglossectomy', area: 'Head & Neck - Oral Cavity', type: 'Glossectomy', keyInd: 'OC' },
    { code: '41140', desc: 'Glossectomy; complete or total, with or without tracheostomy, without radical neck dissection', area: 'Head & Neck - Oral Cavity', type: 'Glossectomy', keyInd: 'OC' },
    { code: '41150', desc: 'Glossectomy; composite procedure with resection floor of mouth and mandibular resection, without radical neck dissection', area: 'Head & Neck - Oral Cavity', type: 'Floor of mouth resection', keyInd: 'OC' },
    { code: '41153', desc: 'Glossectomy; composite procedure with resection floor of mouth, with suprahyoid neck dissection', area: 'Head & Neck - Oral Cavity', type: 'Floor of mouth resection', keyInd: 'OC' },
    { code: '42408', desc: 'Excision of sublingual salivary cyst (ranula)', area: 'Head & Neck - Salivary Gland Excision', type: 'Sublingual gland', keyInd: 'OC' },
    { code: '42450', desc: 'Excision of sublingual gland', area: 'Head & Neck - Salivary Gland Excision', type: 'Sublingual gland', keyInd: 'OC' },
    
    // OCR (Ossicular Chain Reconstruction)
    { code: '69632', desc: 'Tympanoplasty without mastoidectomy (including canalplasty, atticotomy and/or middle ear surgery), initial or revision; with ossicular chain reconstruction (eg, postfenestration)', area: 'Otology/Middle Ear', type: 'Ossicular chain reconstruction', keyInd: 'OCS' },
    { code: '69633', desc: 'Tympanoplasty without mastoidectomy (including canalplasty, atticotomy and/or middle ear surgery), initial or revision; with ossicular chain reconstruction and synthetic prosthesis (eg, partial ossicular replacement prosthesis [PORP], total ossicular replacement prosthesis [TORP])', area: 'Otology/Middle Ear', type: 'Ossicular chain reconstruction', keyInd: 'OCS' },
    { code: '69650', desc: 'Stapes mobilization', area: 'Otology/Middle Ear', type: 'Stapes surgery', keyInd: 'OCS' },
    { code: '69660', desc: 'Stapedectomy or stapedotomy with reestablishment of ossicular continuity, with or without use of foreign material', area: 'Otology/Middle Ear', type: 'Stapes surgery', keyInd: 'OCS' },
    { code: '69661', desc: 'Stapedectomy or stapedotomy with reestablishment of ossicular continuity, with or without use of foreign material; with footplate drill out', area: 'Otology/Middle Ear', type: 'Stapes surgery', keyInd: 'OCS' },
    { code: '69662', desc: 'Revision of stapedectomy or stapedotomy', area: 'Otology/Middle Ear', type: 'Stapes surgery', keyInd: 'OCS' },
    
    // Parotid
    { code: '42410', desc: 'Excision of parotid tumor or parotid gland; lateral lobe, without nerve dissection', area: 'Head & Neck - Salivary Gland Excision', type: 'Parotid', keyInd: 'Par' },
    { code: '42415', desc: 'Excision of parotid tumor or parotid gland; lateral lobe, with dissection and preservation of facial nerve', area: 'Head & Neck - Salivary Gland Excision', type: 'Parotid', keyInd: 'Par' },
    { code: '42420', desc: 'Excision of parotid tumor or parotid gland; total, with dissection and preservation of facial nerve', area: 'Head & Neck - Salivary Gland Excision', type: 'Parotid', keyInd: 'Par' },
    { code: '42425', desc: 'Excision of parotid tumor or parotid gland; total, en bloc removal with sacrifice of facial nerve', area: 'Head & Neck - Salivary Gland Excision', type: 'Parotid', keyInd: 'Par' },
    
    // Rhinoplasty
    { code: '21325', desc: 'Open treatment of nasal fracture; uncomplicated', area: 'Plastic/Trauma', type: 'Nasal fracture', keyInd: 'Rhin' },
    { code: '21330', desc: 'Open treatment of nasal fracture; complicated, with internal and/or external skeletal fixation', area: 'Plastic/Trauma', type: 'Nasal fracture', keyInd: 'Rhin' },
    { code: '21335', desc: 'Open treatment of nasal fracture; with concomitant open treatment of fractured septum', area: 'Plastic/Trauma', type: 'Nasal fracture', keyInd: 'Rhin' },
    { code: '30400', desc: 'Rhinoplasty, primary; lateral and alar cartilages and/or elevation of nasal tip', area: 'Plastic/Facial Appearance', type: 'Rhinoplasty', keyInd: 'Rhin' },
    { code: '30410', desc: 'Rhinoplasty, primary; complete, external parts including bony pyramid, lateral and alar cartilages, and/or elevation of nasal tip', area: 'Plastic/Facial Appearance', type: 'Rhinoplasty', keyInd: 'Rhin' },
    { code: '30430', desc: 'Rhinoplasty, secondary; minor revision (small amount of nasal tip work)', area: 'Plastic/Facial Appearance', type: 'Rhinoplasty', keyInd: 'Rhin' },
    { code: '30435', desc: 'Rhinoplasty, secondary; intermediate revision (bony work with osteotomies)', area: 'Plastic/Facial Appearance', type: 'Rhinoplasty', keyInd: 'Rhin' },
    { code: '30450', desc: 'Rhinoplasty, secondary; major revision (nasal tip work and osteotomies)', area: 'Plastic/Facial Appearance', type: 'Rhinoplasty', keyInd: 'Rhin' },
    { code: '30460', desc: 'Rhinoplasty for nasal deformity secondary to congenital cleft lip and/or palate, including columellar lengthening; tip only', area: 'Plastic/Facial Appearance', type: 'Rhinoplasty', keyInd: 'Rhin' },
    { code: '30462', desc: 'Rhinoplasty for nasal deformity secondary to congenital cleft lip and/or palate, including columellar lengthening; tip, septum, osteotomies', area: 'Plastic/Facial Appearance', type: 'Rhinoplasty', keyInd: 'Rhin' },
    { code: '30465', desc: 'Repair of nasal vestibular stenosis (eg, spreader grafting, lateral nasal wall reconstruction)', area: 'Plastic/Facial Appearance', type: 'Rhinoplasty', keyInd: 'Rhin' },
    { code: '30469', desc: 'Repair of nasal valve collapse with low energy, temperature-controlled (ie, radiofrequency) subcutaneous/submucosal remodeling', area: 'Non-Tracked Codes', type: 'Non-Tracked Codes', keyInd: 'Rhin' },
    
    // Sinus
    { code: '31254', desc: 'Nasal/sinus endoscopy, surgical with ethmoidectomy; partial (anterior)', area: 'General/Peds - Sinus', type: 'Endoscopic sinus surgery', keyInd: 'Sinus' },
    { code: '31255', desc: 'Nasal/sinus endoscopy, surgical with ethmoidectomy; total (anterior and posterior)', area: 'General/Peds - Sinus', type: 'Endoscopic sinus surgery', keyInd: 'Sinus' },
    
    // Endocrine
    { code: '60220', desc: 'Total thyroid lobectomy, unilateral; with or without isthmusectomy', area: 'Head & Neck - Endocrine', type: 'Thyroidectomy', keyInd: 'Thy' },
    { code: '60225', desc: 'Total thyroid lobectomy, unilateral; with contralateral subtotal lobectomy, including isthmusectomy', area: 'Head & Neck - Endocrine', type: 'Thyroidectomy', keyInd: 'Thy' },
    { code: '60240', desc: 'Thyroidectomy, total or complete', area: 'Head & Neck - Endocrine', type: 'Thyroidectomy', keyInd: 'Thy' },
    { code: '60260', desc: 'Thyroidectomy, removal of all remaining thyroid tissue following previous removal of a portion of thyroid', area: 'Head & Neck - Endocrine', type: 'Thyroidectomy', keyInd: 'Thy' },
    { code: '60270', desc: 'Thyroidectomy, including substernal thyroid; sternal split or transthoracic approach', area: 'Head & Neck - Endocrine', type: 'Thyroidectomy', keyInd: 'Thy' },
    { code: '60271', desc: 'Thyroidectomy, including substernal thyroid; cervical approach', area: 'Head & Neck - Endocrine', type: 'Thyroidectomy', keyInd: 'Thy' },
    { code: '60500', desc: 'Parathyroidectomy or exploration of parathyroid(s)', area: 'Head & Neck - Endocrine', type: 'Parathyroidectomy', keyInd: 'Thy' },
    { code: '60502', desc: 'Parathyroidectomy or exploration of parathyroid(s); re-exploration', area: 'Head & Neck - Endocrine', type: 'Parathyroidectomy', keyInd: 'Thy' },
    
    // Tympanoplasty
    { code: '69610', desc: 'Tympanic membrane repair, with or without site preparation of perforation for closure, with or without patch', area: 'Otology/Middle Ear', type: 'Tympanoplasty', keyInd: 'Tymp' },
    { code: '69620', desc: 'Myringoplasty (surgery confined to drumhead and donor area)', area: 'Otology/Middle Ear', type: 'Tympanoplasty', keyInd: 'Tymp' },
    { code: '69631', desc: 'Tympanoplasty without mastoidectomy (including canalplasty, atticotomy and/or middle ear surgery), initial or revision; without ossicular chain reconstruction', area: 'Otology/Middle Ear', type: 'Tympanoplasty', keyInd: 'Tymp' },
  ];

  // Color mapping for key indicators
  const keyIndColors = {
    'Air': 'bg-blue-100 text-blue-800 border-blue-300',
    'Bron': 'bg-purple-100 text-purple-800 border-purple-300',
    'CMF': 'bg-orange-100 text-orange-800 border-orange-300',
    'CM': 'bg-pink-100 text-pink-800 border-pink-300',
    'Flap': 'bg-green-100 text-green-800 border-green-300',
    'Mast': 'bg-indigo-100 text-indigo-800 border-indigo-300',
    'ND': 'bg-red-100 text-red-800 border-red-300',
    'OC': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'OCS': 'bg-teal-100 text-teal-800 border-teal-300',
    'Par': 'bg-cyan-100 text-cyan-800 border-cyan-300',
    'Rhin': 'bg-rose-100 text-rose-800 border-rose-300',
    'Sinus': 'bg-lime-100 text-lime-800 border-lime-300',
    'Thy': 'bg-amber-100 text-amber-800 border-amber-300',
    'Tymp': 'bg-violet-100 text-violet-800 border-violet-300',
  };

  // Fuzzy search scoring function
  const fuzzyScore = (searchTerm, item) => {
    const term = searchTerm.toLowerCase();
    const code = item.code.toLowerCase();
    const desc = item.desc.toLowerCase();
    const area = item.area.toLowerCase();
    const type = item.type.toLowerCase();
    const keyInd = item.keyInd.toLowerCase();

    let score = 0;

    // Exact code match (highest priority)
    if (code === term) score += 1000;
    else if (code.startsWith(term)) score += 500;
    else if (code.includes(term)) score += 100;

    // Key indicator match (high priority)
    if (keyInd === term) score += 800;
    else if (keyInd.includes(term)) score += 400;

    // Description matches
    const descWords = desc.split(' ');
    descWords.forEach(word => {
      if (word.startsWith(term)) score += 50;
      else if (word.includes(term)) score += 20;
    });

    // Exact phrase in description
    if (desc.includes(term)) score += 100;

    // Area and type matches
    if (area.includes(term)) score += 30;
    if (type.includes(term)) score += 30;

    // Fuzzy character matching for typos
    let fuzzyMatch = 0;
    let termIndex = 0;
    for (let i = 0; i < desc.length && termIndex < term.length; i++) {
      if (desc[i] === term[termIndex]) {
        fuzzyMatch++;
        termIndex++;
      }
    }
    if (fuzzyMatch === term.length) score += 10;

    return score;
  };

  // Load search history and analytics from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const historyResult = await window.storage.get('search-history');
        if (historyResult?.value) {
          setSearchHistory(JSON.parse(historyResult.value));
        }

        const analyticsResult = await window.storage.get('search-analytics');
        if (analyticsResult?.value) {
          const analytics = JSON.parse(analyticsResult.value);
          const sorted = Object.entries(analytics)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([term, count]) => ({ term, count }));
          setTopSearches(sorted);
        }
      } catch (error) {
        console.log('Storage not available or error loading data:', error);
      }
    };
    loadData();
  }, []);

  // Save search to history and analytics
  const saveSearch = async (term, code) => {
    if (!term) return;

    try {
      // Update search history
      const newHistory = [{ term, code, timestamp: Date.now() }, ...searchHistory.slice(0, 19)];
      await window.storage.set('search-history', JSON.stringify(newHistory));
      setSearchHistory(newHistory);

      // Update analytics
      const analyticsResult = await window.storage.get('search-analytics');
      const analytics = analyticsResult?.value ? JSON.parse(analyticsResult.value) : {};
      analytics[term] = (analytics[term] || 0) + 1;
      await window.storage.set('search-analytics', JSON.stringify(analytics));

      // Update top searches
      const sorted = Object.entries(analytics)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([term, count]) => ({ term, count }));
      setTopSearches(sorted);
    } catch (error) {
      console.log('Error saving search:', error);
    }
  };

  // Handle search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setShowHistory(false);
      return;
    }

    const scored = cptDatabase
      .map(item => ({ ...item, score: fuzzyScore(searchTerm, item) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    setResults(scored);
    setShowHistory(false);
  }, [searchTerm]);

  // Copy to clipboard
  const copyCode = (code, desc) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    saveSearch(searchTerm, code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Use search history item
  const useHistoryItem = (term) => {
    setSearchTerm(term);
    setShowHistory(false);
    searchInputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">CPT Code Search</h1>
          <p className="text-slate-600">Fast lookup for OR case logging</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => !searchTerm && setShowHistory(true)}
              placeholder="Search by code, procedure, anatomy, or key indicator..."
              className="w-full pl-12 pr-12 py-4 text-lg border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setResults([]);
                  searchInputRef.current?.focus();
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Search History / Top Searches */}
        {showHistory && !searchTerm && (
          <div className="bg-white rounded-xl shadow-md p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recent Searches */}
              {searchHistory.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Recent Searches</h3>
                  </div>
                  <div className="space-y-2">
                    {searchHistory.slice(0, 5).map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => useHistoryItem(item.term)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-between group"
                      >
                        <span className="text-sm text-slate-700">{item.term}</span>
                        {item.code && (
                          <span className="text-xs text-slate-500 font-mono">{item.code}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Searches */}
              {topSearches.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Most Searched</h3>
                  </div>
                  <div className="space-y-2">
                    {topSearches.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => useHistoryItem(item.term)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-between group"
                      >
                        <span className="text-sm text-slate-700">{item.term}</span>
                        <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
                          {item.count}×
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-4 cursor-pointer border-2 border-transparent hover:border-blue-300"
                onClick={() => copyCode(item.code, item.desc)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="text-2xl font-bold text-blue-600 font-mono">{item.code}</div>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-md border ${keyIndColors[item.keyInd] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                      {item.keyInd}
                    </span>
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <p className="text-slate-800 mb-2 leading-relaxed">{item.desc}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        {item.area}
                      </span>
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        {item.type}
                      </span>
                    </div>
                  </div>

                  <button
                    className="flex-shrink-0 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyCode(item.code, item.desc);
                    }}
                  >
                    {copiedCode === item.code ? (
                      <div className="text-green-600 font-semibold text-sm">Copied!</div>
                    ) : (
                      <Copy className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {searchTerm && results.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-slate-500 text-lg">No codes found for "{searchTerm}"</p>
            <p className="text-slate-400 text-sm mt-2">Try searching by procedure name, anatomy, or CPT code</p>
          </div>
        )}

        {/* Empty State */}
        {!searchTerm && !showHistory && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg mb-2">Start typing to search</p>
            <div className="text-sm text-slate-400 space-y-1">
              <p>Try: "thyroid", "31540", "Air", "lefort", "parotid"</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(CPTSearchTool));
