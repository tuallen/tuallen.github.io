/**
 * Lightweight component loader for GitHub Pages
 * Loads HTML components and handles navigation highlighting
 */

(function () {
    'use strict';

    // Load all components when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadComponents);
    } else {
        loadComponents();
    }

    async function loadComponents() {
        const componentElements = document.querySelectorAll('[data-component]');

        // Load all components in parallel
        const loadPromises = Array.from(componentElements).map(async (element) => {
            const componentName = element.getAttribute('data-component');
            const selectedNav = element.getAttribute('data-selected');

            try {
                const response = await fetch(`/components/${componentName}.html`);
                if (!response.ok) {
                    throw new Error(`Failed to load component: ${componentName}`);
                }

                const html = await response.text();
                element.innerHTML = html;

                // Handle navigation highlighting if this is the header
                if (componentName === 'header' && selectedNav) {
                    highlightNavigation(element, selectedNav);
                }
            } catch (error) {
                console.error(`Error loading component ${componentName}:`, error);
            }
        });

        await Promise.all(loadPromises);

        // Set current year in footer copyright
        const copyrightYear = document.getElementById('copyright-year');
        if (copyrightYear) {
            copyrightYear.textContent = new Date().getFullYear();
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
