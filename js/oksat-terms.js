/* =============================================================
   oksat-terms.js — the Interactive learning term lexicon.

   One shared map from an abbreviation, exactly as written in a guide,
   to its full name. js/oksat-learn.js marks every occurrence in guide
   text (and in module questions shown inside a guide) so a tap, hover
   or focus shows the expansion; tools/check-data.mjs runs the same
   scanner over every guide string and fails on an acronym-shaped token
   that is neither a TERM nor PLAIN. Rules: docs/authoring-oksat-guide.md
   (Terms).

   TERMS  key = the surface form (case-sensitive), value = plain text:
          the full name first, then any other names after a semicolon.
          A plural with a lowercase s (NSAIDs, ILC2s) finds its singular.
   PLAIN  general medical knowledge (NSAID, PFT, RCT, COPD, CRP), forms
          that are not abbreviations (roman numerals, IL-n, units), and
          forms whose meaning depends on context (T2): recognized, never
          marked. TERMS is for what a non-otolaryngologist may not know.

   Draft content: the owner verifies expansions as for any guide text.
   ============================================================= */
(function () {
    'use strict';

    const TERMS = {
        /* ---- sources, societies, scales of evidence ---- */
        'ARIA': 'Allergic Rhinitis and its Impact on Asthma (guideline)',
        'CTA': 'Clinical and Translational Allergy (journal)',
        'EPOS': 'European Position Paper on Rhinosinusitis and Nasal Polyps',
        'EUFOREA': 'European Forum for Research and Education in Allergy and Airway Diseases',
        'ICAR': 'International Consensus statement on Allergy and Rhinology',
        'ICAR-AR': 'International Consensus statement on Allergy and Rhinology: Allergic Rhinitis',
        'LIO': 'Laryngoscope Investigative Otolaryngology (journal)',
        'LoE': 'level of evidence',
        'RAND': 'RAND Corporation (RAND/UCLA appropriateness method)',
        'UCLA': 'University of California, Los Angeles (RAND/UCLA appropriateness method)',

        /* ---- statistics and study design ---- */
        'MCID': 'minimal clinically important difference',
        'PROM': 'patient-reported outcome measure',
        'SMD': 'standardized mean difference',

        /* ---- disease names ---- */
        'ABRS': 'acute bacterial rhinosinusitis',
        'AECRS': 'acute exacerbation of chronic rhinosinusitis',
        'AERD': 'aspirin-exacerbated respiratory disease; N-ERD, Samter’s triad',
        'AFRS': 'allergic fungal rhinosinusitis',
        'AR': 'allergic rhinitis',
        'ARS': 'acute rhinosinusitis',
        'CCAD': 'central compartment atopic disease',
        'CRS': 'chronic rhinosinusitis',
        'CRSsNP': 'chronic rhinosinusitis without nasal polyps',
        'CRSwNP': 'chronic rhinosinusitis with nasal polyps',
        'eCRS': 'eosinophilic chronic rhinosinusitis (≥10 eosinophils/hpf)',
        'ETD': 'eustachian tube dysfunction',
        'LAR': 'local allergic rhinitis (entopy)',
        'N-ERD': 'NSAID-exacerbated respiratory disease; AERD',
        'NAR': 'non-allergic rhinitis',
        'NARES': 'non-allergic rhinitis with eosinophilia syndrome',
        'PCD': 'primary ciliary dyskinesia; Kartagener syndrome with situs inversus',
        'RARS': 'recurrent acute rhinosinusitis',

        /* ---- clinical, tests and scores ---- */
        'ACQ-6': 'Asthma Control Questionnaire, 6-item',
        'ACT': 'Asthma Control Test',
        'BAT': 'basophil activation test',
        'CRD': 'component-resolved diagnostics',
        'FeNO': 'fractional exhaled nitric oxide',
        'HDM': 'house dust mite',
        'HSA': 'human serum albumin',
        'LMS': 'Lund–Mackay score (CT)',
        'MQT': 'modified quantitative testing (skin testing)',
        'NCS': 'nasal congestion score',
        'nNO': 'nasal nitric oxide',
        'NPS': 'nasal polyp score',
        'RQLQ': 'Rhinoconjunctivitis Quality of Life Questionnaire',
        'sIgE': 'allergen-specific IgE',
        'sIgG4': 'allergen-specific IgG4',
        'SNOT': 'Sino-Nasal Outcome Test',
        'SNOT-22': 'Sino-Nasal Outcome Test, 22-item (0–110, higher is worse)',
        'SPT': 'skin prick test',
        'TNSS': 'total nasal symptom score',
        'UPSIT': 'University of Pennsylvania Smell Identification Test',

        /* ---- treatment and procedures ---- */
        'AIT': 'allergen immunotherapy (SCIT or SLIT)',
        'AMT': 'appropriate medical therapy',
        'ATAD': 'aspirin therapy after desensitization',
        'BNO1016': 'standardized five-herb extract (Sinupret)',
        'EMLP': 'endoscopic modified Lothrop procedure; Draf III',
        'ESS': 'endoscopic sinus surgery',
        'FESS': 'functional endoscopic sinus surgery',
        'ILIT': 'intralymphatic immunotherapy',
        'INAH': 'intranasal antihistamine',
        'INCS': 'intranasal corticosteroid',
        'LTRA': 'leukotriene receptor antagonist',
        'SCIT': 'subcutaneous immunotherapy',
        'SLIT': 'sublingual immunotherapy',
        'TCM': 'traditional Chinese medicine',

        /* ---- trials ---- */
        'EVEREST': 'head-to-head trial: dupilumab vs omalizumab in CRSwNP with asthma',
        'NAVIGATOR': 'phase 3 trial: tezepelumab in severe asthma',
        'OSTRO': 'phase 3 trial: benralizumab in CRSwNP',
        'POLYP': 'phase 3 trials (POLYP 1 and 2): omalizumab in CRSwNP',
        'SINUS': 'SINUS-24 and SINUS-52, the phase 3 trials of dupilumab in CRSwNP',
        'SINUS-24': 'phase 3 trial: dupilumab in CRSwNP, 24 weeks',
        'SINUS-52': 'phase 3 trial: dupilumab in CRSwNP, 52 weeks',
        'SYNAPSE': 'phase 3 trial: mepolizumab in CRSwNP',
        'WAYPOINT': 'phase 3 trial: tezepelumab in CRSwNP',

        /* ---- anatomy and nerves ---- */
        'GSPN': 'greater (superficial) petrosal nerve',
        'OMC': 'ostiomeatal complex',
        'PNN': 'posterior nasal nerve',

        /* ---- cells ---- */
        'ADCC': 'antibody-dependent cell-mediated cytotoxicity',
        'ILC': 'innate lymphoid cell',
        'ILC1': 'group 1 innate lymphoid cell',
        'ILC2': 'group 2 innate lymphoid cell (type 2: IL-5, IL-13)',
        'ILC3': 'group 3 innate lymphoid cell',
        'Th0': 'naive (uncommitted) CD4 helper T cell',
        'Tr1': 'type 1 regulatory T cell (IL-10-producing)',

        /* ---- receptors, ligands, cytokines ---- */
        'B7-1': 'CD80; costimulatory ligand on the APC for CD28',
        'B7-2': 'CD86; costimulatory ligand on the APC for CD28',
        'CCL5': 'RANTES; chemokine for eosinophils and T cells',
        '5Rα': 'IL-5Rα; IL-5 receptor α chain (benralizumab target)',
        'CD16': 'FcγRIIIa; NK-cell receptor that benralizumab engages for ADCC',
        'CD23': 'FcεRII; low-affinity IgE receptor',
        'CD28': 'T-cell costimulatory receptor for CD80/CD86',
        'CD40': 'B-cell receptor for CD40L; class switching',
        'CD40L': 'CD154; T-cell ligand for CD40 on B cells',
        'CD80': 'B7-1; costimulatory ligand on the APC for CD28',
        'CD86': 'B7-2; costimulatory ligand on the APC for CD28',
        'CD124': 'IL-4Rα; shared chain of the type I and II IL-4 receptors',
        'CD125': 'IL-5Rα; benralizumab target',
        'CD132': 'γc; common gamma chain (IL-2Rγ)',
        'CD154': 'CD40L; T-cell ligand for CD40',
        'CD213a1': 'IL-13Rα1; type II IL-4/IL-13 receptor chain',
        'EP2': 'prostaglandin E2 receptor 2',
        'FcεRI': 'high-affinity IgE receptor (αβγ₂); no CD number',
        'FcεRII': 'CD23; low-affinity IgE receptor',
        'FcεRIII': 'a third IgE receptor as listed by ICAR; standard immunology names only FcεRI and FcεRII',
        'FcγRIIIa': 'CD16; NK-cell receptor that benralizumab engages for ADCC',
        'GITRL': 'glucocorticoid-induced TNF receptor ligand',
        'HMGB1': 'high-mobility group box 1 (alarmin)',
        'IL-2Rγ': 'CD132; common gamma chain (γc)',
        'IL-4Rα': 'CD124; shared chain of the type I and II IL-4 receptors (dupilumab target)',
        'IL-5Rα': 'CD125; IL-5 receptor α chain (benralizumab target)',
        'IL-13Rα1': 'CD213a1; type II IL-4/IL-13 receptor chain',
        'IL1RL1': 'ST2; the IL-33 receptor',
        'ITAM': 'immunoreceptor tyrosine-based activation motif',
        'LSR': 'lipolysis-stimulated lipoprotein receptor; angulin-1 (tricellular tight junction)',
        'PR-10': 'pathogenesis-related protein family 10 (birch Bet v 1 homologs)',
        'SP': 'substance P',
        'ST2': 'IL1RL1; the IL-33 receptor',
        'TL1A': 'TNF-like ligand 1A',
        'TRP': 'transient receptor potential (ion channel)',
        'TRPA1': 'transient receptor potential ankyrin 1',
        'TRPV1': 'transient receptor potential vanilloid 1 (capsaicin receptor)',
        'TSLP': 'thymic stromal lymphopoietin (epithelial alarmin)',
        'VIP': 'vasoactive intestinal peptide',

        /* ---- signalling and transcription ---- */
        'AP-1': 'activator protein 1 (transcription factor)',
        'EGR-2': 'early growth response 2 (transcription factor)',
        'GATA-3': 'GATA-binding protein 3; Th2 master transcription factor',
        'NFAT': 'nuclear factor of activated T cells',
        'STAT4': 'signal transducer and activator of transcription 4 (Th1)',
        'STAT5': 'signal transducer and activator of transcription 5',
        'STAT6': 'signal transducer and activator of transcription 6 (IL-4/IL-13 → Th2)',
        'ZO-1': 'zonula occludens-1 (tight-junction protein)',

        /* ---- eicosanoids ---- */
        '5-LO': '5-lipoxygenase (ALOX5); zileuton target',
        '15-HETE': '15-hydroxyeicosatetraenoic acid',
        '15-LOX-1': '15-lipoxygenase-1',
        '15-oxo-ETE': '15-oxo-eicosatetraenoic acid',
        'ALOX5': '5-lipoxygenase gene',
        'CysLT': 'cysteinyl leukotriene (LTC4, LTD4, LTE4)',
        'CysLT1': 'cysteinyl leukotriene receptor 1 (montelukast target)',
        'LTC4': 'leukotriene C4',
        'LTD4': 'leukotriene D4',
        'LTE4': 'leukotriene E4 (urinary marker in AERD)',
        'PGD2': 'prostaglandin D2',
        'PGE2': 'prostaglandin E2',
        'PGF2': 'prostaglandin F2',

        /* ---- molecules and genes ---- */
        'ECP': 'eosinophil cationic protein',
        'FCER1A': 'gene for the FcεRI α chain',
        'MS4A2': 'gene for the FcεRI β chain',
    };

    const PLAIN = new Set([
        'ACE', 'AIDS', 'ALP', 'ANCA', 'APC', 'BPH', 'c-ANCA', 'CD', 'CF', 'CFTR', 'cGMP', 'CGRP', 'CI', 'CNS',
        'COPD', 'COVID-19', 'COX-1', 'COX-2', 'CPK', 'CRP', 'CSF', 'CT', 'DAMP', 'DC', 'DNA', 'EGPA', 'EM',
        'ENT', 'EoE', 'ESR', 'FDA', 'FEV1', 'FOXP3', 'GERD', 'GI', 'GM-CSF', 'GPA', 'GRADE', 'H1', 'H2',
        'HIV', 'HPA', 'hpf', 'HTN', 'ICS', 'ID', 'IFN-γ', 'IgA', 'IgE', 'IgG', 'IgG4', 'IgM', 'IV', 'LFT',
        'M2', 'MHC', 'MI', 'mL', 'MRI', 'NEJM', 'NF-κB', 'NGF', 'NK', 'nL', 'NO', 'NPV', 'NSAID', 'OCS', 'OH',
        'OSA', 'OTC', 'P450', 'PAF', 'PCR', 'PDE5', 'PEF', 'PFT', 'PKG', 'PM2', 'PND', 'PPI', 'PPV', 'PR3',
        'QOL', 'RCT', 'RF', 'RR', 'SABA', 'SES', 'sGC', 'SSRI', 't-PA', 'T1', 'T2', 'TCA', 'TGF-β', 'Th1',
        'Th17', 'Th2', 'Treg', 'UK', 'URI', 'URTI', 'US', 'VAS',
    ]);
    /* Roman numerals (Draf IIa, type III), interleukins and their chains by number. */
    const PLAIN_RE = /^(?:(?:I{1,3}|IV|VI{0,3}|IX|XI{0,3})[ab]?|IL-\d+[A-F]?|[DE]4)$/;

    /* A word with internal hyphens; split on them for the longest match. */
    const WORD = /[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu;
    /* Acronym-shaped: two capitals, a capital and a digit, or lowercase into a capital (eCRS, sIgE). */
    const SHAPED = /[A-Z].*[A-Z\d]|^[a-z]+[A-Z]|\d.*[A-Z]/;

    function lookup(s) {
        if (Object.prototype.hasOwnProperty.call(TERMS, s)) return { key: s };
        if (PLAIN.has(s) || PLAIN_RE.test(s)) return { plain: true };
        if (/[^s]s$/.test(s)) {
            const one = s.slice(0, -1);
            if (Object.prototype.hasOwnProperty.call(TERMS, one)) return { key: one };
            if (PLAIN.has(one)) return { plain: true };
        }
        return null;
    }

    /* scan(text) → [{ i, j, key }] for marked terms, and unknown → [token] of
       acronym-shaped parts that match nothing. Longest hyphen-joined run wins:
       anti-IL-5Rα → IL-5Rα; IgE-mediated → IgE. */
    function scan(text) {
        const s = String(text == null ? '' : text);
        const hits = [], unknown = [];
        let m;
        WORD.lastIndex = 0;
        while ((m = WORD.exec(s))) {
            const parts = m[0].split('-');
            const at = [];
            let pos = m.index;
            parts.forEach((p) => { at.push(pos); pos += p.length + 1; });
            let a = 0;
            while (a < parts.length) {
                let found = null, b;
                for (b = parts.length; b > a; b--) {
                    found = lookup(parts.slice(a, b).join('-'));
                    if (found) break;
                }
                if (found) {
                    if (found.key) hits.push({ i: at[a], j: at[b - 1] + parts[b - 1].length, key: found.key });
                    a = b;
                } else {
                    if (SHAPED.test(parts[a])) unknown.push(parts[a]);
                    a++;
                }
            }
        }
        return { hits, unknown };
    }

    window.OKSATTerms = {
        get: (k) => (Object.prototype.hasOwnProperty.call(TERMS, k) ? TERMS[k] : null),
        scan: scan,
        keys: () => Object.keys(TERMS),
    };
})();
