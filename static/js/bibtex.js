/**
 * BibTeX Page Functionality
 * Handles copy to clipboard and download functionality for BibTeX references
 */

document.addEventListener('DOMContentLoaded', function () {
    // Copy to clipboard functionality with fallback
    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const bibtexContent = document.getElementById('bibtex-content').textContent;

            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(bibtexContent).then(function () {
                    showNotification();
                }).catch(function (err) {
                    console.error('Clipboard API failed, trying fallback: ', err);
                    fallbackCopy(bibtexContent);
                });
            } else {
                // Use fallback for older browsers or insecure contexts
                fallbackCopy(bibtexContent);
            }
        });
    }

    // Fallback copy method using textarea
    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showNotification();
            } else {
                alert('Failed to copy to clipboard. Please select and copy manually.');
            }
        } catch (err) {
            console.error('Fallback copy failed: ', err);
            alert('Failed to copy to clipboard. Please select and copy manually.');
        }

        document.body.removeChild(textarea);
    }

    // Show success notification
    function showNotification() {
        const copyBtn = document.getElementById('copy-btn');
        const icon = copyBtn.querySelector('i');
        const textSpan = copyBtn.querySelector('.btn-text');

        // Store original state
        const originalIconClass = icon.className;
        let originalText = '';
        if (textSpan) {
            originalText = textSpan.textContent;
        }

        // Change button appearance
        copyBtn.classList.add('copied');
        icon.className = 'fa fa-check';

        // Only change text if it's visible (desktop)
        if (textSpan && getComputedStyle(textSpan).display !== 'none') {
            textSpan.textContent = 'Copied!';
        }

        // Reset after 2 seconds
        setTimeout(function () {
            copyBtn.classList.remove('copied');
            icon.className = originalIconClass;
            if (textSpan) {
                textSpan.textContent = originalText;
            }
        }, 2000);
    }

    // Download .bib file functionality
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function () {
            const bibtexContent = document.getElementById('bibtex-content').textContent;

            // Create a Blob from the content
            const blob = new Blob([bibtexContent], { type: 'text/plain' });

            // Create a temporary download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'allentu_references.bib';

            // Trigger download
            document.body.appendChild(a);
            a.click();

            // Cleanup
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        });
    }
});
