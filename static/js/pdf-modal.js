/**
 * pdf-modal.js
 * Full-screen PDF viewer modal with toolbar.
 * - Injected lazily on first open (no DOM cost on load)
 * - Intercepts all a[href*=".pdf"] clicks site-wide
 * - Appends #view=FitH to force zoom-to-fit on every open
 * - Closes on Escape, toolbar ×, or backdrop click
 */

// ── Helpers ──────────────────────────────────────────────

/** Dynamically load pdf.js if not already loaded */
async function _loadPdfJs() {
  if (window.pdfjsLib) return;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/** Determine optimal viewer URL by probing PDF dimensions */
async function _getOptimalViewerUrl(url) {
  // If user already specified a view/zoom parameter, respect it
  if (url.includes('zoom=') || url.includes('view=')) return url;

  try {
    await _loadPdfJs();
    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.0 });

    // If width > height, it's likely a poster or presentation slide
    if (viewport.width > viewport.height) {
      return url + (url.includes('#') ? '&' : '#') + 'view=Fit';
    }
  } catch (e) {
    console.warn('Failed to parse PDF dimensions, falling back to default zoom:', e);
  }

  // Fallback to raw URL (default browser behavior) for standard portrait documents
  return url;
}

/** Create and cache the overlay DOM element. */
function _getOrCreateOverlay() {
  let overlay = document.getElementById('pdfOverlay');
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.id = 'pdfOverlay';
  overlay.className = 'pdf-overlay';
  overlay.innerHTML = `
    <div class="pdf-toolbar">
      <div class="pdf-toolbar-left">
        <a href="#" onclick="closePDF(event)" class="pdf-logo-close" aria-label="Close">
          <i class="ai ai-allentu logo-desktop"></i>
          <i class="ai ai-tu logo-mobile"></i>
        </a>
        <div class="pdf-title" id="pdfTitle"></div>
      </div>
      <div class="pdf-toolbar-actions">
        <a class="pdf-toolbar-btn" id="pdfDownload" href="#" download>
          <i class="fas fa-download"></i><span class="btn-label">Download</span>
        </a>
        <a class="pdf-toolbar-btn" id="pdfNewTab" href="#" target="_blank">
          <i class="fas fa-external-link-alt"></i><span class="btn-label">Open in New Tab</span>
        </a>
        <button class="pdf-toolbar-btn close-btn" onclick="closePDF(event)" aria-label="Close">&times;</button>
      </div>
    </div>
    <div class="pdf-viewer-container">
      <iframe class="pdf-viewer-frame" id="pdfFrame" src=""></iframe>
    </div>
  `;
  document.body.appendChild(overlay);

  // Close on backdrop click (not toolbar click)
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closePDF();
  });

  return overlay;
}

// ── Public API ───────────────────────────────────────────

async function openPDF(event, url, title) {
  if (event) event.preventDefault();

  const overlay = _getOrCreateOverlay();

  document.getElementById('pdfTitle').textContent = title || 'PDF';
  document.getElementById('pdfDownload').href = url;
  document.getElementById('pdfNewTab').href = url;

  // Show modal immediately with loading state
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  void overlay.offsetWidth; // trigger CSS transition
  overlay.classList.add('show');

  // Determine optimal zoom and load iframe
  const optimalUrl = await _getOptimalViewerUrl(url);
  document.getElementById('pdfFrame').src = optimalUrl;
}

function closePDF(event) {
  if (event) event.preventDefault();
  const overlay = document.getElementById('pdfOverlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  document.body.style.overflow = '';
  setTimeout(function () {
    overlay.classList.remove('active');
    document.getElementById('pdfFrame').src = '';
  }, 250);
}

// ── Global event listeners ────────────────────────────────

// Close on Escape key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closePDF();
});

// Intercept all PDF link clicks site-wide
document.body.addEventListener('click', function (e) {
  const link = e.target.closest('a[href*=".pdf"]');
  if (!link) return;

  // Skip links inside the pdf viewer overlay itself (Download, Open in New Tab)
  if (link.closest('#pdfOverlay')) return;

  // Skip links that already call openPDF explicitly via onclick
  const onclick = link.getAttribute('onclick') || '';
  if (onclick.includes('openPDF')) return;

  e.preventDefault();
  const title = link.innerText.trim() || link.getAttribute('title') || 'PDF Document';
  openPDF(e, link.href, title);
});
