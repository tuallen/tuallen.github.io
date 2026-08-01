/**
 * Lightweight component loader for GitHub Pages
 * Loads HTML components, handles navigation highlighting,
 * and triggers entrance animations on first visit.
 * Uses sessionStorage to eliminate flash on internal navigation.
 */

(function () {
    'use strict';

    // Get version from the current script source to use for cache busting fetched components
    const scriptElement = document.currentScript || document.querySelector('script[src*="components.js"]');
    const version = scriptElement ? new URL(scriptElement.src, window.location.href).searchParams.get('v') : null;
    const cacheKey = (name) => `component:${name}:${version}`;
    const navEntry = performance.getEntriesByType('navigation')[0];
    const isReload = navEntry && navEntry.type === 'reload';
    const isFirstVisit = !sessionStorage.getItem('visited') || isReload;

    /**
     * Fill a placeholder from sessionStorage. Returns true if it was filled.
     *
     * Doing this before first paint is what keeps the header and footer from
     * flashing in on internal navigation.
     */
    function injectFromCache(element) {
        if (element.dataset.componentReady) return true;
        const componentName = element.getAttribute('data-component');
        const cached = sessionStorage.getItem(cacheKey(componentName));
        if (!cached) return false;

        element.innerHTML = cached;
        element.dataset.componentReady = 'true';
        const selectedNav = element.getAttribute('data-selected');
        if (componentName === 'header' && selectedNav) {
            highlightNavigation(element, selectedNav);
        }
        applyEntrance(element, componentName);
        return true;
    }

    /**
     * Add the first-visit entrance class.
     *
     * Applied as soon as the markup lands rather than after the network settles,
     * so on a reload (which counts as a first visit but has a warm cache) the
     * animation starts with the paint instead of a beat later.
     */
    function applyEntrance(element, componentName) {
        if (!isFirstVisit) return;
        if (element.dataset.entranceApplied) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const target = element.querySelector(componentName === 'header' ? 'header' : 'footer');
        if (!target) return;
        target.classList.add(componentName === 'header' ? 'header-entrance' : 'footer-entrance');
        element.dataset.entranceApplied = 'true';
    }

    // This script runs in <head>, so the placeholders in <body> do not exist yet
    // and cannot be queried. Watch the document as it parses instead and fill each
    // placeholder the moment it appears — that lands the cached markup in the first
    // paint. (Previously this ran as a one-shot querySelectorAll here, which always
    // matched zero elements, so every navigation waited for DOMContentLoaded and
    // the header visibly popped in.)
    if (document.readyState === 'loading' && 'MutationObserver' in window) {
        const parseObserver = new MutationObserver(() => {
            document.querySelectorAll('[data-component]:not([data-component-ready])')
                .forEach(injectFromCache);
        });
        parseObserver.observe(document.documentElement, { childList: true, subtree: true });
        document.addEventListener('DOMContentLoaded', () => parseObserver.disconnect(), { once: true });
    }

    // Full load (fetch from network, apply animations, set up interactivity)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadComponents);
    } else {
        loadComponents();
    }

    async function loadComponents() {
        const componentElements = document.querySelectorAll('[data-component]');

        // Anything the parse-time pass missed (no cache yet, or no MutationObserver)
        // still gets the cached markup before we hit the network.
        componentElements.forEach(injectFromCache);

        const loadPromises = Array.from(componentElements).map(async (element) => {
            const componentName = element.getAttribute('data-component');
            const selectedNav = element.getAttribute('data-selected');

            try {
                const componentUrl = `/components/${componentName}.html${version ? '?v=' + version : ''}`;
                const response = await fetch(componentUrl);
                if (!response.ok) {
                    throw new Error(`Failed to load component: ${componentName}`);
                }

                const html = await response.text();

                // Cache for instant injection on next navigation
                sessionStorage.setItem(cacheKey(componentName), html);

                // Only re-inject if the cache did not already fill this in.
                // Replacing identical markup would restart the entrance animation
                // and discard the nav highlight for no visible benefit.
                const alreadyFilled = element.dataset.componentReady === 'true';
                if (!alreadyFilled) {
                    element.innerHTML = html;
                    element.dataset.componentReady = 'true';
                    if (componentName === 'header' && selectedNav) {
                        highlightNavigation(element, selectedNav);
                    }
                }

                // Apply external-link new-tab handling to this component's markup.
                // Scoped to the injected element — new-tabs.js already handled the
                // rest of the document on DOMContentLoaded.
                if (typeof window.applyExternalLinkTargets === 'function') {
                    window.applyExternalLinkTargets(element);
                }

                // Staggered entrance on first visit only
                applyEntrance(element, componentName);
            } catch (error) {
                console.error(`Error loading component ${componentName}:`, error);
            }
        });

        await Promise.all(loadPromises);

        if (isFirstVisit) {
            sessionStorage.setItem('visited', '1');
        }

        // Keep the footer copyright year current. The markup already carries a year,
        // so this only writes when the two differ — i.e. after New Year, until the
        // committed value is updated. Writing unconditionally would dirty the text
        // node on every load and reflow the footer for no reason, which is what the
        // empty span this replaced used to do.
        const copyrightYear = document.getElementById('copyright-year');
        if (copyrightYear) {
            const currentYear = String(new Date().getFullYear());
            if (copyrightYear.textContent.trim() !== currentYear) {
                copyrightYear.textContent = currentYear;
            }
        }

        // Set up theme toggle button after footer has loaded
        if (typeof window.setupThemeToggle === 'function') {
            window.setupThemeToggle();
        }
    }

    function highlightNavigation(headerElement, selectedNav) {
        const navLinks = headerElement.querySelectorAll('[data-nav]');
        navLinks.forEach(link => {
            if (link.getAttribute('data-nav') === selectedNav) {
                link.id = 'selected';
            }
        });

        // Nav links navigate immediately on touch. Delaying the tap to play the
        // underline animation first read as lag, which is worse than not seeing it.
    }
})();
