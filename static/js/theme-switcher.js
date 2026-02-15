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
     * Set up the theme toggle button
     */
    function setupToggleButton() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                toggleTheme();
            });

            // Update icon to match current theme
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
})();
