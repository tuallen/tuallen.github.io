/* ---- Open external links in new tabs ---- */
document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll('a[href]');

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
});