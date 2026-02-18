document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('bibtex-modal');
    const openBtn = document.getElementById('open-bibtex-modal');
    const closeBtn = document.querySelector('.close-modal-btn');
    const copyBtn = document.getElementById('modal-copy-btn');
    const downloadBtn = document.getElementById('modal-download-btn');
    const bibtexContentElement = document.getElementById('modal-bibtex-content');

    if (openBtn) {
        openBtn.addEventListener('click', function (e) {
            e.preventDefault();
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent scrolling background
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        });
    }

    window.addEventListener('click', function (e) {
        if (e.target == modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        }
    });

    // Copy to clipboard functionality
    if (copyBtn && bibtexContentElement) {
        copyBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const textToCopy = bibtexContentElement.textContent;

            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    showNotification(copyBtn);
                }).catch(err => {
                    console.error('Clipboard API failed: ', err);
                    fallbackCopy(textToCopy);
                });
            } else {
                fallbackCopy(textToCopy);
            }
        });
    }

    // Fallback copy method
    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed'; // Avoid scrolling to bottom
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showNotification(copyBtn);
            } else {
                alert('Failed to copy. Please select and copy manually.');
            }
        } catch (err) {
            console.error('Fallback copy failed: ', err);
            alert('Failed to copy. Please select and copy manually.');
        }

        document.body.removeChild(textarea);
    }

    // Show success notification
    function showNotification(btn) {
        const icon = btn.querySelector('i');
        const textSpan = btn.querySelector('.btn-text');

        // Store original state
        const originalIconClass = icon.className;
        let originalText = '';
        if (textSpan) {
            originalText = textSpan.textContent;
        }

        btn.classList.add('copied');
        icon.className = 'fa fa-check';

        // Only change text if it's visible (desktop)
        if (textSpan && getComputedStyle(textSpan).display !== 'none') {
            textSpan.textContent = 'Copied!';
        }

        setTimeout(function () {
            btn.classList.remove('copied');
            icon.className = originalIconClass;
            if (textSpan) {
                textSpan.textContent = originalText;
            }
        }, 2000);
    }

    // Download functionality
    if (downloadBtn && bibtexContentElement) {
        downloadBtn.addEventListener('click', function () {
            const content = bibtexContentElement.textContent;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'allentu_references.bib';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        });
    }
});
