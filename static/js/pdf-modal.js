/**
 * pdf-modal.js
 * Full-screen PDF viewer modal with toolbar.
 * - Injected lazily on first open (no DOM cost on load)
 * - Intercepts all a[href*=".pdf"] clicks site-wide
 * - Appends #view=FitH to force zoom-to-fit on every open
 * - Closes on Escape, toolbar ×, or backdrop click
 */

// ── Helpers ──────────────────────────────────────────────

/** Append #view=FitH to a PDF URL (skips if already set). */
function _pdfViewerUrl(url) {
  if (url.includes('view=')) return url;
  return url + (url.includes('#') ? '&' : '#') + 'view=FitH';
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
      <div class="pdf-title" id="pdfTitle"></div>
      <div class="pdf-toolbar-actions">
        <a class="pdf-toolbar-btn" id="pdfDownload" href="#" download>
          <i class="fas fa-download"></i><span class="btn-label">Download</span>
        </a>
        <a class="pdf-toolbar-btn" id="pdfNewTab" href="#" target="_blank">
          <i class="fas fa-external-link-alt"></i><span class="btn-label">Open in Tab</span>
        </a>
        <button class="pdf-toolbar-btn close-btn" onclick="closePDF()" aria-label="Close">&times;</button>
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

function openPDF(event, url, title) {
  if (event) event.preventDefault();

  const overlay = _getOrCreateOverlay();

  document.getElementById('pdfTitle').textContent = title || 'PDF';
  document.getElementById('pdfDownload').href = url;
  document.getElementById('pdfNewTab').href = url;
  document.getElementById('pdfFrame').src = _pdfViewerUrl(url);

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  void overlay.offsetWidth; // trigger CSS transition
  overlay.classList.add('show');
}

function closePDF() {
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

  // Skip links that already call openPDF explicitly via onclick
  const onclick = link.getAttribute('onclick') || '';
  if (onclick.includes('openPDF')) return;

  e.preventDefault();
  const title = link.innerText.trim() || link.getAttribute('title') || 'PDF Document';
  openPDF(e, link.href, title);
});
