/**
 * Lightweight component loader for GitHub Pages
 * Loads HTML components, handles navigation highlighting,
 * and triggers entrance animations on first visit.
 */

(function () {
    'use strict';

    // Load all components when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadComponents);
    } else {
        loadComponents();
    }

    // Get version from the current script source to use for cache busting fetched components
    const scriptElement = document.currentScript || document.querySelector('script[src*="components.js"]');
    const version = scriptElement ? new URL(scriptElement.src, window.location.href).searchParams.get('v') : null;

    async function loadComponents() {
        const componentElements = document.querySelectorAll('[data-component]');

        // Load all components in parallel
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
                element.innerHTML = html;

                // Handle navigation highlighting if this is the header
                if (componentName === 'header' && selectedNav) {
                    highlightNavigation(element, selectedNav);
                }

                // Staggered entrance on first visit only
                if (componentName === 'header' && !sessionStorage.getItem('visited')) {
                    const header = element.querySelector('header');
                    if (header && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                        header.classList.add('header-entrance');
                    }
                }

                if (componentName === 'footer' && !sessionStorage.getItem('visited')) {
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

        // Mark session as visited (after all entrance animations are applied)
        if (!sessionStorage.getItem('visited')) {
            sessionStorage.setItem('visited', '1');
        }

        // Apply external-link new-tab handling to markup injected by components,
        // since new-tabs.js runs on DOMContentLoaded before components load.
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
        // Find the navigation link that matches the selected page
        const navLinks = headerElement.querySelectorAll('[data-nav]');
        navLinks.forEach(link => {
            if (link.getAttribute('data-nav') === selectedNav) {
                link.id = 'selected';
            }
        });
    }
})();
