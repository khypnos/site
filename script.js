// Configuration simplifiée - URLs des pages d'index uniquement
const indexUrls = {
    version1: '../index.html',
    version2: './iade/index_iade.html'
};

// Fonction pour gérer le changement de version (version simplifiée)
function handleVersionToggleSimple() {
    const toggle = document.getElementById('page-toggle');
    
    // Détecter la version actuelle au chargement de la page
    const currentPath = window.location.pathname;
    const isCurrentlyV2 = currentPath.includes('/iade/');
    toggle.checked = isCurrentlyV2;
    
    // Gérer le changement de version
    toggle.addEventListener('change', function() {
        const isVersion2 = this.checked;
        const targetUrl = isVersion2 ? indexUrls.version2 : indexUrls.version1;
        
        // Sauvegarder la préférence
        localStorage.setItem('preferredVersion', isVersion2 ? 'version2' : 'version1');
        
        // Animation de transition (optionnelle)
        document.body.style.opacity = '0.8';
        document.body.style.transform = 'scale(0.98)';
        
        // Redirection après une courte animation
        setTimeout(() => {
            window.location.href = targetUrl;
        }, 200);
    });
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', handleVersionToggleSimple);

// Fonction pour appliquer la version préférée (optionnelle)
function applyPreferredVersion() {
    const preferred = localStorage.getItem('preferredVersion');
    const currentPath = window.location.pathname;
    
    if (preferred === 'version2' && !currentPath.includes('/iade/')) {
        window.location.href = indexUrls.version2;
    } else if (preferred === 'version1' && !currentPath.includes('/medecin/')) {
        window.location.href = indexUrls.version1;
    }
}

// Appliquer la version préférée au chargement (optionnel)
// Décommentez cette ligne si vous voulez forcer la redirection
// document.addEventListener('DOMContentLoaded', applyPreferredVersion);

// Hamburger menu

document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger-menu');
    const navMenu = document.querySelector('.nav-menu');

    // Toggle menu when hamburger is clicked
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('change');
        navMenu.classList.toggle('active');
    });

    // Close menu when a nav link is clicked
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('change');
            navMenu.classList.remove('active');
        });
    });

    // Close menu when clicking outside of it
    document.addEventListener('click', function(event) {
        if (!navMenu.contains(event.target) && !hamburger.contains(event.target)) {
            hamburger.classList.remove('change');
            navMenu.classList.remove('active');
        }
    });
});
