/**
 * Theme Switcher
 * Handles manual theme toggle with localStorage persistence
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'theme-preference';
    const THEME_ATTR = 'data-theme';

    /**
     * Get the preferred theme from localStorage (default to light)
     */
    function getPreferredTheme() {
        const storedTheme = localStorage.getItem(STORAGE_KEY);
        return storedTheme || 'light'; // Always default to light mode
    }

    /**
     * Apply the theme to the document
     */
    function applyTheme(theme, bustFavicon) {
        document.documentElement.setAttribute(THEME_ATTR, theme);
        updateThemeIcon(theme);
        updateFavicon(theme, bustFavicon);
    }

    /**
     * Update favicon based on theme.
     *
     * `bust` adds a timestamp query so the browser re-fetches even though the
     * filename may be unchanged — browsers (especially Edge) cache favicons
     * aggressively and won't repaint the tab otherwise. It is only passed when
     * the theme actually changes; on initial load we reuse the ?v= already in
     * the markup so the icons stay cacheable across navigations.
     */
    function updateFavicon(theme, bust) {
        const svgLink = document.querySelector('link[rel="icon"][type="image/svg+xml"]');
        const icoLink = document.querySelector('link[rel="icon"][sizes="any"]');

        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        let name;
        if (systemDark) {
            // OS/browser is dark → white favicon stands out against dark chrome
            name = 'tu_white';
        } else {
            // OS/browser is light → match the site theme accent color exactly
            // Light theme: #b03b3b (tu_light), Dark theme: #e05252 (tu_dark)
            name = theme === 'dark' ? 'tu_dark' : 'tu_light';
        }

        // Reuse the existing ?v= (the cache-bust version baked into the HTML) so an
        // unchanged icon keeps its URL — and therefore its cache entry — on page load.
        const setIcon = (link, ext) => {
            if (!link) return;
            const query = bust ? `?v=${Date.now()}` : new URL(link.href, location.href).search;
            const next = `/static/icons/${name}.${ext}${query}`;
            if (link.getAttribute('href') !== next) link.href = next;
        };

        setIcon(svgLink, 'svg');
        // Also update ICO — Edge ignores SVG favicons and uses the ICO link for the tab icon
        setIcon(icoLink, 'ico');
    }

    /**
     * Update the theme toggle aria-label
     */
    function updateThemeIcon(theme) {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

        themeToggle.setAttribute('aria-label',
            theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }

    /**
     * Toggle between light and dark themes
     */
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute(THEME_ATTR) || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        // Save preference
        localStorage.setItem(STORAGE_KEY, newTheme);

        // Apply new theme (bust the favicon cache — the icon color changes)
        applyTheme(newTheme, true);
    }

    /**
     * Set up the theme toggle button using event delegation
     * This ensures the toggle works even if the button is dynamically replaced
     */
    let toggleListenerAttached = false;
    function setupToggleButton() {
        // Use event delegation - attach listener to document once
        if (!toggleListenerAttached) {
            document.addEventListener('click', (e) => {
                const themeToggle = e.target.closest('#theme-toggle');
                if (themeToggle) {
                    e.preventDefault();
                    toggleTheme();
                }
            });
            toggleListenerAttached = true;
        }

        // Update icon to match current theme (if button exists)
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const currentTheme = document.documentElement.getAttribute(THEME_ATTR) || 'light';
            updateThemeIcon(currentTheme);
        }
    }

    /**
     * Initialize theme on page load
     */
    function initTheme() {
        const theme = getPreferredTheme();
        applyTheme(theme);

        // Try to set up button immediately
        setupToggleButton();

        // Also try after DOM is ready (in case components haven't loaded yet)
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupToggleButton);
        }

        // Also try after a short delay to catch dynamically loaded components
        setTimeout(setupToggleButton, 100);
        setTimeout(setupToggleButton, 500);
    }

    // Initialize immediately to prevent flash of wrong theme
    initTheme();

    // Expose setupToggleButton globally so components.js can call it
    window.setupThemeToggle = setupToggleButton;
    // Listen for system theme changes to update favicon immediately
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const currentTheme = document.documentElement.getAttribute(THEME_ATTR) || 'light';
        updateFavicon(currentTheme, true);
    });
})();
