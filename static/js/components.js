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

    // Inject cached components immediately (before DOMContentLoaded) to prevent flash
    document.querySelectorAll('[data-component]').forEach((element) => {
        const componentName = element.getAttribute('data-component');
        const cached = sessionStorage.getItem(cacheKey(componentName));
        if (cached) {
            element.innerHTML = cached;
            const selectedNav = element.getAttribute('data-selected');
            if (componentName === 'header' && selectedNav) {
                highlightNavigation(element, selectedNav);
            }
        }
    });

    // Full load (fetch from network, apply animations, set up interactivity)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadComponents);
    } else {
        loadComponents();
    }

    async function loadComponents() {
        const componentElements = document.querySelectorAll('[data-component]');

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

                // Only re-inject if not already populated from cache
                if (!element.querySelector('header, footer')) {
                    element.innerHTML = html;
                }

                if (componentName === 'header' && selectedNav) {
                    highlightNavigation(element, selectedNav);
                }

                // Staggered entrance on first visit only
                if (componentName === 'header' && isFirstVisit) {
                    const header = element.querySelector('header');
                    if (header && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                        header.classList.add('header-entrance');
                    }
                }

                if (componentName === 'footer' && isFirstVisit) {
                    const footer = element.querySelector('footer');
                    if (footer && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                        footer.classList.add('footer-entrance');
                    }
                }
            } catch (error) {
                console.error(`Error loading component ${componentName}:`, error);
            }
        });

        await Promise.all(loadPromises);

        if (isFirstVisit) {
            sessionStorage.setItem('visited', '1');
        }

        // Apply external-link new-tab handling to markup injected by components
        if (typeof window.applyExternalLinkTargets === 'function') {
            window.applyExternalLinkTargets(document);
        }

        // Set current year in footer copyright
        const copyrightYear = document.getElementById('copyright-year');
        if (copyrightYear) {
            copyrightYear.textContent = new Date().getFullYear();
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

        // On touch devices, play the underline animation before navigating
        if ('ontouchstart' in window) {
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    if (link.id === 'selected') return;
                    e.preventDefault();
                    link.style.backgroundSize = '100% 2px';
                    setTimeout(() => {
                        window.location.href = link.href;
                    }, 180);
                });
            });
        }
    }
})();
