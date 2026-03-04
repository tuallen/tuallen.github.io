/**
 * image-modal.js
 * Modal viewer for standalone image links.
 * - Injected lazily on first open (no DOM cost on load)
 * - Intercepts all image href clicks (.jpg, .jpeg, .png, .gif, .webp) site-wide
 * - Title read from link's title attribute, then alt of any wrapped <img>, then filename
 * - Closes on Escape, × button, or backdrop click
 */

// ── Helpers ──────────────────────────────────────────────

/** Create and cache the image overlay DOM element. */
function _getOrCreateImageOverlay() {
  let overlay = document.getElementById('imageModalOverlay');
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.id = 'imageModalOverlay';
  overlay.className = 'image-modal-overlay';
  overlay.innerHTML = `
    <div class="image-modal-content">
      <div class="modal-header" style="margin-bottom: 12px; padding-bottom: 8px;">
        <h2 id="modalImageTitle" style="font-size: 1.2rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60vw;">Image</h2>
        <div class="modal-actions">
          <a class="copy-code-btn" id="modalImageDownload" href="#" download>
            <i class="fa fa-download"></i>
            <span class="btn-text">Download</span>
          </a>
          <a class="copy-code-btn" id="modalImageNewTab" href="#" target="_blank">
            <i class="fas fa-external-link-alt"></i>
            <span class="btn-text">Open in New Tab</span>
          </a>
          <button class="close-modal-btn" onclick="closeImageModal(event)" aria-label="Close">
            <i class="fa fa-times"></i>
          </button>
        </div>
      </div>
      <div class="modal-image-container">
        <img id="modalImageElement" src="" alt="">
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Close on backdrop click (not modal content)
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay || e.target.classList.contains('modal-image-container')) {
      closeImageModal();
    }
  });

  return overlay;
}

// ── Public API ───────────────────────────────────────────

function openImageModal(event, url, title) {
  if (event) event.preventDefault();

  const overlay = _getOrCreateImageOverlay();

  document.getElementById('modalImageTitle').textContent = title || 'Image';
  document.getElementById('modalImageDownload').href = url;
  document.getElementById('modalImageNewTab').href = url;

  const imgElement = document.getElementById('modalImageElement');

  // Try .webp first; fall back to the original if the .webp doesn't exist.
  // Clear onerror immediately after firing to prevent infinite error loops.
  const absUrl = new URL(url, location.href).href;
  const webpUrl = absUrl.replace(/\.(png|jpe?g)(\?.*)?$/i, (_, ext, qs) => '.webp' + (qs || ''));

  if (webpUrl !== absUrl) {
    imgElement.onerror = function () {
      this.onerror = null; // prevent infinite loop
      this.src = absUrl;
    };
    imgElement.src = webpUrl;
  } else {
    imgElement.onerror = null;
    imgElement.src = absUrl;
  }

  imgElement.alt = title || '';

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  void overlay.offsetWidth; // trigger CSS transition
  overlay.classList.add('show');
}

function closeImageModal(event) {
  if (event) event.preventDefault();
  const overlay = document.getElementById('imageModalOverlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  document.body.style.overflow = '';
  setTimeout(function () {
    overlay.classList.remove('active');
    document.getElementById('modalImageElement').src = '';
  }, 250);
}

// ── Global event listeners ────────────────────────────────

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeImageModal();
});

// Intercept standalone image link clicks site-wide
document.body.addEventListener('click', function (e) {
  const link = e.target.closest('a');
  if (!link) return;

  const href = link.getAttribute('href');
  if (!href || !/\.(jpe?g|png|gif|webp)(\?.*)?$/i.test(href)) return;

  // Skip links inside the overlay itself (Download, Open in New Tab)
  if (link.closest('#imageModalOverlay')) return;

  e.preventDefault();

  // Prefer explicit title, then alt of a wrapped <img>, then the filename
  let title = link.getAttribute('title');
  if (!title) {
    const img = link.querySelector('img');
    title = img && (img.getAttribute('alt') || img.getAttribute('title'));
  }
  if (!title) {
    try { title = new URL(link.href).pathname.split('/').pop(); } catch (_) { }
  }

  openImageModal(e, link.href, title || 'Image');
});
