// Theme toggle
const themeToggleBtn = document.getElementById('themeToggle');
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('sk_theme', next);
    themeToggleBtn.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
  });
}

// State
let rawPdfBytes = null;
let loadedPdfDoc = null;
let sourceFileName = "Document.pdf";
let totalPdfPages = 0;
let rawBookmarks = [];
let activeItems = [];
let isExtractionCancelled = false;

// Elements
const dropZone = document.getElementById('dropZone');
const pdfFileInput = document.getElementById('pdfFileInput');
const dropTitle = document.getElementById('dropTitle');
const dropSubtitle = document.getElementById('dropSubtitle');
const fileMetaStrip = document.getElementById('fileMetaStrip');
const fileNameLabel = document.getElementById('fileNameLabel');
const fileSizeLabel = document.getElementById('fileSizeLabel');
const filePagesCountLabel = document.getElementById('filePagesCountLabel');
const detectedPagesBadge = document.getElementById('detectedPagesBadge');
const queueBadge = document.getElementById('queueBadge');
const chapterTableBody = document.getElementById('chapterTableBody');
const selectAllCheckbox = document.getElementById('selectAllCheckbox');
const selectedCountDisplay = document.getElementById('selectedCountDisplay');
const extractZipBtn = document.getElementById('extractZipBtn');
const addRowBtn = document.getElementById('addRowBtn');
const resetAppBtn = document.getElementById('resetAppBtn');
const intervalControls = document.getElementById('intervalControls');
const intervalInput = document.getElementById('intervalInput');
const bookmarkDepthControls = document.getElementById('bookmarkDepthControls');
const outlineDepthSelect = document.getElementById('outlineDepthSelect');
const progressModal = document.getElementById('progressModal');
const progressBarFill = document.getElementById('progressBarFill');
const progressPercent = document.getElementById('progressPercent');
const progressStatus = document.getElementById('progressStatus');
const cancelExtractionBtn = document.getElementById('cancelExtractionBtn');

// Toast
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast-item ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.2s, transform 0.2s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 3600);
}

// Helper: Escape HTML in inputs
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// --- Bookmark / Outline Parsing Engine ---
async function extractBookmarks(pdfDoc) {
  const bookmarks = [];
  try {
    const catalog = pdfDoc.catalog;
    const pages = pdfDoc.getPages();
    const total = pages.length;

    // Map page references to 1-based page numbers
    const pageRefMap = new Map();
    const pageNodeMap = new Map();

    pages.forEach((p, idx) => {
      const pageNum = idx + 1;
      if (p.ref) {
        pageRefMap.set(p.ref.toString(), pageNum);
        if (p.ref.tag) pageRefMap.set(String(p.ref.tag), pageNum);
      }
      if (p.node) {
        pageNodeMap.set(p.node, pageNum);
      }
    });

    // Named Destinations Map
    const namedDests = new Map();

    // 1. Catalog -> Dests
    try {
      const destsRef = catalog.get(PDFLib.PDFName.of('Dests'));
      if (destsRef) {
        const destsDict = pdfDoc.context.lookup(destsRef);
        if (destsDict instanceof PDFLib.PDFDict) {
          const entries = destsDict.entries();
          for (const [k, v] of entries) {
            const kStr = k.value || (k.asString ? k.asString().replace(/^\//, '') : String(k));
            namedDests.set(kStr, v);
          }
        }
      }
    } catch (e) {}

    // 2. Catalog -> Names -> Dests (Name Tree)
    try {
      const namesRef = catalog.get(PDFLib.PDFName.of('Names'));
      if (namesRef) {
        const namesDict = pdfDoc.context.lookup(namesRef);
        if (namesDict instanceof PDFLib.PDFDict) {
          const treeRef = namesDict.get(PDFLib.PDFName.of('Dests'));
          if (treeRef) {
            parseNameTreeNode(pdfDoc.context.lookup(treeRef), namedDests, pdfDoc);
          }
        }
      }
    } catch (e) {}

    function parseNameTreeNode(node, map, doc) {
      if (!node || !(node instanceof PDFLib.PDFDict)) return;
      const namesArrRef = node.get(PDFLib.PDFName.of('Names'));
      if (namesArrRef) {
        const arr = doc.context.lookup(namesArrRef);
        if (arr instanceof PDFLib.PDFArray) {
          for (let i = 0; i < arr.size(); i += 2) {
            const kObj = doc.context.lookup(arr.get(i));
            const vObj = arr.get(i + 1);
            let key = null;
            if (kObj instanceof PDFLib.PDFString || kObj instanceof PDFLib.PDFHexString) {
              try { key = kObj.decodeText(); } catch (e) { key = kObj.asString(); }
            } else if (kObj instanceof PDFLib.PDFName) {
              key = kObj.value || kObj.asString().replace(/^\//, '');
            }
            if (key) map.set(key, vObj);
          }
        }
      }
      const kidsRef = node.get(PDFLib.PDFName.of('Kids'));
      if (kidsRef) {
        const kids = doc.context.lookup(kidsRef);
        if (kids instanceof PDFLib.PDFArray) {
          for (let i = 0; i < kids.size(); i++) {
            parseNameTreeNode(doc.context.lookup(kids.get(i)), map, doc);
          }
        }
      }
    }

    function resolveDestination(dest) {
      if (!dest) return null;
      let destObj = dest;
      if (destObj instanceof PDFLib.PDFRef) {
        destObj = pdfDoc.context.lookup(destObj);
      }
      if (!destObj) return null;

      // Named Destination (Name or String)
      if (destObj instanceof PDFLib.PDFName || destObj instanceof PDFLib.PDFString || destObj instanceof PDFLib.PDFHexString) {
        let dName = null;
        if (destObj instanceof PDFLib.PDFName) {
          dName = destObj.value || (destObj.asString ? destObj.asString().replace(/^\//, '') : null);
        } else {
          try { dName = destObj.decodeText(); } catch (e) { dName = destObj.asString(); }
        }
        if (dName && namedDests.has(dName)) {
          return resolveDestination(namedDests.get(dName));
        }
        return null;
      }

      // Dictionary with /D or /Dest
      if (destObj instanceof PDFLib.PDFDict) {
        const d = destObj.get(PDFLib.PDFName.of('D')) || destObj.get(PDFLib.PDFName.of('Dest'));
        if (d) return resolveDestination(d);
        return null;
      }

      // Array: [pageRef /Fit ...] or [pageNumber /XYZ ...]
      if (destObj instanceof PDFLib.PDFArray && destObj.size() > 0) {
        const rawTarget = destObj.get(0);
        if (rawTarget instanceof PDFLib.PDFNumber) {
          const val = rawTarget.asNumber();
          if (val >= 0 && val < total) return val + 1;
        }
        if (rawTarget instanceof PDFLib.PDFRef) {
          const refStr = rawTarget.toString();
          if (pageRefMap.has(refStr)) return pageRefMap.get(refStr);
          if (rawTarget.tag && pageRefMap.has(String(rawTarget.tag))) return pageRefMap.get(String(rawTarget.tag));
          const targetDict = pdfDoc.context.lookup(rawTarget);
          if (targetDict && pageNodeMap.has(targetDict)) return pageNodeMap.get(targetDict);
        }
        const lookedUp = pdfDoc.context.lookup(rawTarget);
        if (lookedUp && pageNodeMap.has(lookedUp)) {
          return pageNodeMap.get(lookedUp);
        }
      }

      return null;
    }

    const outlinesRef = catalog.get(PDFLib.PDFName.of('Outlines'));
    if (!outlinesRef) return [];
    const outlines = pdfDoc.context.lookup(outlinesRef);
    if (!outlines || !(outlines instanceof PDFLib.PDFDict)) return [];

    const visited = new Set();

    function traverseNode(nodeRef, depth = 0) {
      if (!nodeRef) return;
      const refKey = nodeRef.toString ? nodeRef.toString() : String(nodeRef);
      if (visited.has(refKey)) return;
      visited.add(refKey);

      const node = pdfDoc.context.lookup(nodeRef);
      if (!node || !(node instanceof PDFLib.PDFDict)) return;

      // Decode title
      let title = "";
      const rawTitle = node.get(PDFLib.PDFName.of('Title'));
      if (rawTitle) {
        const titleObj = pdfDoc.context.lookup(rawTitle);
        if (titleObj instanceof PDFLib.PDFString || titleObj instanceof PDFLib.PDFHexString) {
          try { title = titleObj.decodeText(); } catch (e) { title = titleObj.asString(); }
        }
      }
      title = (title || `Section ${bookmarks.length + 1}`).trim();

      // Resolve Destination
      let destObj = node.get(PDFLib.PDFName.of('Dest'));
      if (!destObj) {
        const aRef = node.get(PDFLib.PDFName.of('A'));
        if (aRef) {
          const aObj = pdfDoc.context.lookup(aRef);
          if (aObj instanceof PDFLib.PDFDict) {
            const sObj = aObj.get(PDFLib.PDFName.of('S'));
            const sVal = sObj?.value || (sObj?.asString ? sObj.asString().replace(/^\//, '') : null);
            if (sVal === 'GoTo') {
              destObj = aObj.get(PDFLib.PDFName.of('D'));
            }
          }
        }
      }

      const pageNum = resolveDestination(destObj);
      if (pageNum !== null && pageNum >= 1 && pageNum <= total) {
        bookmarks.push({ title, pageNum, depth });
      }

      // Children first
      const firstRef = node.get(PDFLib.PDFName.of('First'));
      if (firstRef) traverseNode(firstRef, depth + 1);

      // Sibling
      const nextRef = node.get(PDFLib.PDFName.of('Next'));
      if (nextRef) traverseNode(nextRef, depth);
    }

    const firstItemRef = outlines.get(PDFLib.PDFName.of('First'));
    if (firstItemRef) {
      traverseNode(firstItemRef, 0);
    }

  } catch (err) {
    console.warn("Soft error parsing bookmarks:", err);
  }

  return bookmarks;
}

// --- Queue Generation Strategies ---
function generateFromBookmarks(bookmarks, total, depthMode = 'all') {
  let source = [...bookmarks];
  if (depthMode === 'top') {
    const minDepth = Math.min(...source.map(b => b.depth));
    source = source.filter(b => b.depth === minDepth);
  }

  source.sort((a, b) => a.pageNum - b.pageNum);

  // Deduplicate bookmarks landing on the exact same page
  const unique = [];
  for (const bm of source) {
    if (unique.length > 0 && unique[unique.length - 1].pageNum === bm.pageNum) {
      continue;
    }
    unique.push(bm);
  }

  const items = [];
  for (let i = 0; i < unique.length; i++) {
    const curr = unique[i];
    const next = unique[i + 1];
    const start = curr.pageNum;
    let end = next ? next.pageNum - 1 : total;
    if (end < start) end = start;

    items.push({
      id: `Ch_${i + 1}`,
      title: curr.title.replace(/[^a-zA-Z0-9 _\-\.]/g, ' ').replace(/\s+/g, ' ').trim() || `Chapter ${i + 1}`,
      start: start,
      end: end,
      selected: true
    });
  }
  return items;
}

function generateFixedIntervals(total, interval) {
  const items = [];
  let current = 1;
  let count = 1;
  while (current <= total) {
    const end = Math.min(current + interval - 1, total);
    items.push({
      id: `Part_${count}`,
      title: `Part ${count} (Pages ${current}-${end})`,
      start: current,
      end: end,
      selected: true
    });
    current = end + 1;
    count++;
  }
  return items;
}

// --- Table Rendering & Interaction ---
function renderTable() {
  if (!loadedPdfDoc || activeItems.length === 0) {
    chapterTableBody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-queue">
            <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="opacity: 0.5;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
            <span>${!loadedPdfDoc ? 'Select or drop a PDF file above to generate chapters' : 'No chapters queued. Click "+ Add Chapter Row".'}</span>
          </div>
        </td>
      </tr>
    `;
    selectedCountDisplay.textContent = '0';
    extractZipBtn.disabled = true;
    selectAllCheckbox.checked = false;
    return;
  }

  let selectedCount = 0;
  chapterTableBody.innerHTML = '';

  activeItems.forEach((item, idx) => {
    if (item.selected) selectedCount++;
    const span = Math.max(0, item.end - item.start + 1);

    const tr = document.createElement('tr');
    tr.className = item.selected ? '' : 'unselected';
    tr.dataset.index = idx;

    tr.innerHTML = `
      <td style="text-align: center;">
        <input type="checkbox" class="row-checkbox" data-index="${idx}" ${item.selected ? 'checked' : ''}>
      </td>
      <td style="text-align: center;" class="mono" style="color: var(--ink-muted);">
        ${String(idx + 1).padStart(2, '0')}
      </td>
      <td>
        <input type="text" class="row-title-input" data-index="${idx}" value="${escapeHtml(item.title)}">
      </td>
      <td style="text-align: center;">
        <input type="number" class="row-num-input row-start-input" data-index="${idx}" min="1" max="${totalPdfPages}" value="${item.start}">
      </td>
      <td style="text-align: center;">
        <input type="number" class="row-num-input row-end-input" data-index="${idx}" min="1" max="${totalPdfPages}" value="${item.end}">
      </td>
      <td style="text-align: center;">
        <span class="tag-pill mono">${span} pg${span === 1 ? '' : 's'}</span>
      </td>
      <td style="text-align: center;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
          <button class="btn btn-secondary btn-sm row-single-btn" data-index="${idx}" title="Download this chapter immediately">PDF</button>
          <button class="btn btn-icon btn-sm row-del-btn" data-index="${idx}" title="Remove row">&times;</button>
        </div>
      </td>
    `;

    chapterTableBody.appendChild(tr);
  });

  selectedCountDisplay.textContent = selectedCount;
  selectAllCheckbox.checked = selectedCount === activeItems.length && activeItems.length > 0;
  extractZipBtn.disabled = selectedCount === 0;

  attachTableListeners();
}

function attachTableListeners() {
  document.querySelectorAll('.row-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      activeItems[idx].selected = e.target.checked;
      const tr = e.target.closest('tr');
      if (tr) {
        tr.className = e.target.checked ? '' : 'unselected';
      }
      updateSelectionCounts();
    });
  });

  document.querySelectorAll('.row-title-input').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      activeItems[idx].title = e.target.value;
    });
  });

  document.querySelectorAll('.row-start-input').forEach(inp => {
    inp.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      const val = parseInt(e.target.value, 10) || 1;
      activeItems[idx].start = Math.max(1, Math.min(val, totalPdfPages));
      if (activeItems[idx].end < activeItems[idx].start) {
        activeItems[idx].end = activeItems[idx].start;
      }
      renderTable();
    });
  });

  document.querySelectorAll('.row-end-input').forEach(inp => {
    inp.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      const val = parseInt(e.target.value, 10) || activeItems[idx].start;
      activeItems[idx].end = Math.max(activeItems[idx].start, Math.min(val, totalPdfPages));
      renderTable();
    });
  });

  document.querySelectorAll('.row-single-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      await exportSingleChapter(idx);
    });
  });

  document.querySelectorAll('.row-del-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      activeItems.splice(idx, 1);
      renderTable();
    });
  });
}

function updateSelectionCounts() {
  const selectedCount = activeItems.filter(i => i.selected).length;
  selectedCountDisplay.textContent = selectedCount;
  selectAllCheckbox.checked = selectedCount === activeItems.length && activeItems.length > 0;
  extractZipBtn.disabled = selectedCount === 0;
}

// --- Mode Management ---
function applyStrategy() {
  if (!loadedPdfDoc) return;
  const mode = document.querySelector('input[name="splitMode"]:checked').value;

  document.querySelectorAll('.mode-item').forEach(el => el.classList.remove('active'));
  const activeItem = document.querySelector(`input[name="splitMode"][value="${mode}"]`).closest('.mode-item');
  if (activeItem) activeItem.classList.add('active');

  if (mode === 'bookmarks') {
    intervalControls.style.display = 'none';
    if (rawBookmarks.length > 0) {
      bookmarkDepthControls.style.display = 'flex';
      const depth = outlineDepthSelect.value;
      activeItems = generateFromBookmarks(rawBookmarks, totalPdfPages, depth);
      queueBadge.textContent = `${activeItems.length} Chapters (Bookmarks)`;
      showToast(`Generated ${activeItems.length} chapters from document bookmarks.`, 'success');
    } else {
      bookmarkDepthControls.style.display = 'none';
      showToast('No outline bookmarks found in this PDF. Switched to Fixed Intervals.', 'info');
      document.querySelector('input[name="splitMode"][value="fixed"]').checked = true;
      applyStrategy();
      return;
    }
  } else if (mode === 'fixed') {
    bookmarkDepthControls.style.display = 'none';
    intervalControls.style.display = 'flex';
    const interval = parseInt(intervalInput.value, 10) || 10;
    activeItems = generateFixedIntervals(totalPdfPages, interval);
    queueBadge.textContent = `${activeItems.length} Parts (${interval} pgs/each)`;
  } else if (mode === 'custom') {
    bookmarkDepthControls.style.display = 'none';
    intervalControls.style.display = 'none';
    if (activeItems.length === 0) {
      activeItems = [{ id: 'Custom_1', title: 'Part 1', start: 1, end: totalPdfPages, selected: true }];
    }
    queueBadge.textContent = 'Custom Manual Plan';
  }

  renderTable();
}

document.querySelectorAll('input[name="splitMode"]').forEach(radio => {
  radio.addEventListener('change', applyStrategy);
});

intervalInput.addEventListener('change', () => {
  if (document.querySelector('input[name="splitMode"]:checked').value === 'fixed') {
    applyStrategy();
  }
});

outlineDepthSelect.addEventListener('change', () => {
  if (document.querySelector('input[name="splitMode"]:checked').value === 'bookmarks') {
    applyStrategy();
  }
});

// --- File Ingestion ---
dropZone.addEventListener('click', () => pdfFileInput.click());
dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    pdfFileInput.click();
  }
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    handleUploadedFile(e.dataTransfer.files[0]);
  }
});

pdfFileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files.length > 0) {
    handleUploadedFile(e.target.files[0]);
  }
});

async function handleUploadedFile(file) {
  if (!file || (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf')) {
    showToast('Please select a valid PDF file.', 'error');
    return;
  }

  sourceFileName = file.name;
  dropTitle.textContent = file.name;
  dropSubtitle.textContent = 'Parsing page map and outlines...';

  try {
    const buffer = await file.arrayBuffer();
    rawPdfBytes = buffer;

    // Load PDF with ignoreEncryption to handle protected PDFs
    loadedPdfDoc = await PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true });
    totalPdfPages = loadedPdfDoc.getPageCount();

    // Populate metadata strip
    fileNameLabel.textContent = file.name;
    fileSizeLabel.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    filePagesCountLabel.textContent = `${totalPdfPages} pgs`;
    fileMetaStrip.style.display = 'flex';

    detectedPagesBadge.textContent = `${totalPdfPages} pgs`;
    detectedPagesBadge.style.display = 'inline-flex';

    dropSubtitle.textContent = 'Ready for lossless slicing.';

    // Extract Bookmarks
    rawBookmarks = await extractBookmarks(loadedPdfDoc);

    if (rawBookmarks.length > 0) {
      document.querySelector('input[name="splitMode"][value="bookmarks"]').checked = true;
      showToast(`Loaded ${file.name} (${totalPdfPages} pages, ${rawBookmarks.length} bookmarks).`, 'success');
    } else {
      document.querySelector('input[name="splitMode"][value="fixed"]').checked = true;
      showToast(`Loaded ${file.name} (${totalPdfPages} pages). No bookmarks detected.`, 'info');
    }

    applyStrategy();

  } catch (err) {
    console.error(err);
    showToast('Failed to load PDF: ' + err.message, 'error');
    dropSubtitle.textContent = 'Failed to parse file. Try another PDF.';
  }
}

// Reset All
resetAppBtn.addEventListener('click', () => {
  rawPdfBytes = null;
  loadedPdfDoc = null;
  sourceFileName = "Document.pdf";
  totalPdfPages = 0;
  rawBookmarks = [];
  activeItems = [];
  pdfFileInput.value = ""; // Crucial bugfix so same file can be reloaded

  dropTitle.textContent = "Drop a PDF file here, or click to browse";
  dropSubtitle.textContent = "Single textbook, surgical manual, or paper (Runs entirely offline in-browser)";
  fileMetaStrip.style.display = 'none';
  detectedPagesBadge.style.display = 'none';
  queueBadge.textContent = "No PDF Loaded";
  extractZipBtn.disabled = true;

  renderTable();
  showToast('Workspace reset.', 'info');
});

// Add Manual Row
addRowBtn.addEventListener('click', () => {
  if (!loadedPdfDoc) {
    showToast('Please load a PDF first.', 'error');
    return;
  }
  document.querySelector('input[name="splitMode"][value="custom"]').checked = true;
  document.querySelectorAll('.mode-item').forEach(el => el.classList.remove('active'));
  document.getElementById('modeItemCustom').classList.add('active');
  bookmarkDepthControls.style.display = 'none';
  intervalControls.style.display = 'none';
  queueBadge.textContent = 'Custom Manual Plan';

  const last = activeItems[activeItems.length - 1];
  const start = last ? Math.min(last.end + 1, totalPdfPages) : 1;
  const end = Math.min(start + 5, totalPdfPages);

  activeItems.push({
    id: `Custom_${activeItems.length + 1}`,
    title: `Custom Part ${activeItems.length + 1}`,
    start: start,
    end: end,
    selected: true
  });

  renderTable();
});

// Select All Checkbox
selectAllCheckbox.addEventListener('change', (e) => {
  activeItems.forEach(i => i.selected = e.target.checked);
  renderTable();
});

// --- Lossless Splitting Engine ---
async function exportSingleChapter(index) {
  if (!loadedPdfDoc) return;
  const item = activeItems[index];

  if (item.start > totalPdfPages || item.start < 1 || item.end < item.start) {
    showToast(`Invalid page range for "${item.title}".`, 'error');
    return;
  }

  try {
    showToast(`Extracting "${item.title}"...`, 'info');
    const newDoc = await PDFLib.PDFDocument.create();

    const pageIndices = [];
    for (let p = item.start - 1; p < Math.min(item.end, totalPdfPages); p++) {
      pageIndices.push(p);
    }

    const copiedPages = await newDoc.copyPages(loadedPdfDoc, pageIndices);
    copiedPages.forEach(p => newDoc.addPage(p));

    const pdfBytes = await newDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    let cleanName = item.title.replace(/[/\\?%*:|"<>]/g, '-').trim();
    if (!cleanName) cleanName = `Chapter_${index + 1}`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${cleanName}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);

    showToast(`Downloaded: ${cleanName}.pdf`, 'success');
  } catch (err) {
    console.error(err);
    showToast('Export failed: ' + err.message, 'error');
  }
}

// Batch ZIP Extraction
extractZipBtn.addEventListener('click', async () => {
  if (!loadedPdfDoc) return;
  const selected = activeItems.filter(i => i.selected);
  if (selected.length === 0) {
    showToast('No chapters selected for extraction.', 'error');
    return;
  }

  progressModal.style.display = 'flex';
  progressBarFill.style.width = '0%';
  progressPercent.textContent = '0%';
  isExtractionCancelled = false;

  try {
    const zip = new JSZip();
    const totalCount = selected.length;

    for (let i = 0; i < totalCount; i++) {
      if (isExtractionCancelled) {
        showToast('Batch extraction cancelled.', 'info');
        break;
      }

      const item = selected[i];
      const pct = Math.round(((i + 1) / totalCount) * 100);
      progressBarFill.style.width = `${pct}%`;
      progressPercent.textContent = `${pct}%`;
      progressStatus.textContent = `[${i + 1}/${totalCount}] Slicing: ${item.title}...`;

      const effectiveEnd = Math.min(item.end, totalPdfPages);
      if (item.start <= totalPdfPages && effectiveEnd >= item.start) {
        const newDoc = await PDFLib.PDFDocument.create();
        const pageIndices = [];
        for (let p = item.start - 1; p < effectiveEnd; p++) {
          pageIndices.push(p);
        }

        const copied = await newDoc.copyPages(loadedPdfDoc, pageIndices);
        copied.forEach(p => newDoc.addPage(p));

        const bytes = await newDoc.save();
        let clean = item.title.replace(/[/\\?%*:|"<>]/g, '-').trim();
        if (!clean) clean = `Part_${i + 1}`;

        const indexPad = String(i + 1).padStart(String(totalCount).length, '0');
        zip.file(`${indexPad} - ${clean}.pdf`, bytes);
      }

      // Non-blocking pause for UI thread
      await new Promise(r => setTimeout(r, 15));
    }

    if (!isExtractionCancelled) {
      progressStatus.textContent = 'Compressing archive...';
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipName = sourceFileName.replace(/\.pdf$/i, '') + '_Chapters.zip';

      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = zipName;
      link.click();
      URL.revokeObjectURL(link.href);

      showToast(`Success! Archived ${totalCount} files in ${zipName}`, 'success');
    }

  } catch (err) {
    console.error(err);
    showToast('Batch extraction error: ' + err.message, 'error');
  } finally {
    progressModal.style.display = 'none';
  }
});

cancelExtractionBtn.addEventListener('click', () => {
  isExtractionCancelled = true;
  progressModal.style.display = 'none';
  showToast('Cancellation requested.', 'info');
});

// Initial render
renderTable();
