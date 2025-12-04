// Dark Mode - Global functionality for all pages
(function() {
    // Load dark mode preference on page load
    function initDarkMode() {
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        if (savedDarkMode) {
            document.body.classList.add('dark-mode');
        }
    }

    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDarkMode);
    } else {
        initDarkMode();
    }

    // Listen for dark mode changes from settings page
    window.addEventListener('storage', function(e) {
        if (e.key === 'darkMode') {
            const isDark = e.newValue === 'true';
            if (isDark) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        }
    });

    // Also check periodically (for same-tab changes)
    setInterval(function() {
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        const hasDarkMode = document.body.classList.contains('dark-mode');
        
        if (savedDarkMode && !hasDarkMode) {
            document.body.classList.add('dark-mode');
        } else if (!savedDarkMode && hasDarkMode) {
            document.body.classList.remove('dark-mode');
        }
    }, 500);
})();

