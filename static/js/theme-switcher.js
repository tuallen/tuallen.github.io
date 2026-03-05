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
    function applyTheme(theme) {
        document.documentElement.setAttribute(THEME_ATTR, theme);
        updateThemeIcon(theme);
        updateFavicon(theme);
    }

    /**
     * Update favicon based on theme
     */
    function updateFavicon(theme) {
        const svgLink = document.querySelector('link[rel="icon"][type="image/svg+xml"]');
        const icoLink = document.querySelector('link[rel="icon"][sizes="any"]');

        // Use a timestamp cache-buster so the browser always re-fetches on theme switch.
        // Browsers (especially Edge) aggressively cache favicons and won't update if the URL is the same.
        const bust = '?v=' + Date.now();
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

        if (svgLink) svgLink.href = `/static/icons/${name}.svg` + bust;
        // Also update ICO — Edge ignores SVG favicons and uses the ICO link for the tab icon
        if (icoLink) icoLink.href = `/static/icons/${name}.ico` + bust;
    }

    /**
     * Update the theme toggle icon
     * Moon icon in light mode (click to go dark)
     * Sun icon in dark mode (click to go light)
     */
    function updateThemeIcon(theme) {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

        const icon = themeToggle.querySelector('i');
        if (!icon) return;

        if (theme === 'dark') {
            // In dark mode, show sun (click to go light)
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            themeToggle.setAttribute('aria-label', 'Switch to light mode');
        } else {
            // In light mode, show moon (click to go dark)
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            themeToggle.setAttribute('aria-label', 'Switch to dark mode');
        }
    }

    /**
     * Toggle between light and dark themes
     */
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute(THEME_ATTR) || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        // Save preference
        localStorage.setItem(STORAGE_KEY, newTheme);

        // Apply new theme
        applyTheme(newTheme);
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
        updateFavicon(currentTheme);
    });
})();
