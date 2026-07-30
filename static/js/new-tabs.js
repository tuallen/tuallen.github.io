/* ---- Open external links in new tabs ---- */

// Apply target="_blank" to external links within a given root element.
// Exposed globally so dynamically injected markup (e.g. components loaded by
// components.js) can be processed after it is added to the DOM.
function applyExternalLinkTargets(root = document) {
    const links = root.querySelectorAll('a[href]');

    links.forEach(a => {
        const href = a.getAttribute('href');
        if (!href) return;

        // Skip local/internal links
        if (
            href.startsWith('#') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:') ||
            href.startsWith('/') ||
            href.startsWith('./') ||
            href.startsWith('../')
        ) return;

        // Only process absolute URLs
        if (href.startsWith('http://') || href.startsWith('https://')) {
            try {
                const url = new URL(href);
                // Open external links in new tab
                if (url.origin !== window.location.origin) {
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                }
            } catch (e) {
                console.warn('Invalid URL:', href);
            }
        }
    });
}

window.applyExternalLinkTargets = applyExternalLinkTargets;

document.addEventListener("DOMContentLoaded", () => {
    applyExternalLinkTargets(document);
});
