/**
 * pdf-modal.js
 * Full-screen PDF viewer modal with toolbar.
 * - Injected lazily on first open (no DOM cost on load)
 * - Intercepts all a[href*=".pdf"] clicks site-wide via event delegation
 * - Probes first page dimensions via pdf.js to auto-apply #view=Fit for
 *   landscape/poster documents; falls back to browser default for portrait
 * - Title read from link's title attribute, then innerText
 * - On mobile (touch) devices, skips the modal and lets the browser/OS
 *   handle PDFs natively (iframe PDF rendering is unsupported on Android/iOS)
 * - Closes on Escape, toolbar ×, or backdrop click
 */

/** True on any touch-primary device (Android, iOS, iPadOS). */
const _isMobile = () => navigator.maxTouchPoints > 0 && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

// ── Helpers ──────────────────────────────────────────────

/** Dynamically load pdf.js if not already loaded. */
async function _loadPdfJs() {
  if (window.pdfjsLib) return;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/** Return the URL with an optimal zoom fragment appended.
 *  Landscape/poster PDFs get #view=Fit; portrait docs use browser default. */
async function _getOptimalViewerUrl(url) {
  // Respect any existing view/zoom parameter
  if (url.includes('zoom=') || url.includes('view=')) return url;

  try {
    await _loadPdfJs();
    const pdf = await pdfjsLib.getDocument(url).promise;
    const viewport = (await pdf.getPage(1)).getViewport({ scale: 1.0 });
    if (viewport.width > viewport.height) {
      return url + (url.includes('#') ? '&' : '#') + 'view=Fit';
    }
  } catch (e) {
    console.warn('pdf-modal: failed to probe PDF dimensions, using default zoom.', e);
  }

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

  // Close on backdrop click (not toolbar)
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
  document.getElementById('pdfNewTab').href = url;

  const downloadBtn = document.getElementById('pdfDownload');
  downloadBtn.target = '';
  downloadBtn.href = '#';
  downloadBtn.onclick = async (e) => {
    e.preventDefault();
    const originalHtml = downloadBtn.innerHTML;

    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span class="btn-label">Downloading...</span>';
    downloadBtn.style.pointerEvents = 'none';

    try {
      // For arXiv, use the bare URL (no .pdf) — that endpoint returns CORS headers.
      // Appending .pdf triggers a 301 redirect that drops Access-Control-Allow-Origin.
      const fetchUrl = url.includes('arxiv.org') && url.endsWith('.pdf')
        ? url.slice(0, -4) : url;
      const res = await fetch(fetchUrl);
      const blob = await res.blob();

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;

      const disposition = res.headers.get('content-disposition') || '';
      const nameMatch = disposition.match(/filename="?([^"]+)"?/);
      const arxivIdMatch = url.match(/arxiv\.org\/(?:pdf|abs)\/([\d.]+)/);
      const baseName = url.split('/').pop().split('?')[0];
      a.download = nameMatch ? nameMatch[1]
        : arxivIdMatch ? `${arxivIdMatch[1]}.pdf`
          : baseName || 'document.pdf';

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('pdf-modal: download failed, opening in new tab.', err);
      window.open(url, '_blank');
    } finally {
      downloadBtn.innerHTML = originalHtml;
      downloadBtn.style.pointerEvents = '';
    }
  };

  // Show modal immediately while zoom is being determined
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  void overlay.offsetWidth; // trigger CSS transition
  overlay.classList.add('show');

  document.getElementById('pdfFrame').src = await _getOptimalViewerUrl(url);
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

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closePDF();
});

// Intercept all PDF link clicks site-wide
document.body.addEventListener('click', function (e) {
  const link = e.target.closest('a[href*=".pdf"]');
  if (!link) return;

  // Skip links inside the overlay itself (Download, Open in New Tab)
  if (link.closest('#pdfOverlay')) return;

  // On mobile, iframe PDF rendering is not supported — let the browser handle it natively
  if (_isMobile()) return;

  e.preventDefault();
  // Prefer explicit title attribute, fall back to visible link text
  const title = link.getAttribute('title') || link.innerText.trim() || 'PDF Document';
  openPDF(e, link.href, title);
});
