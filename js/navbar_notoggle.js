
function loadNavbar() {
	
    const navbarHTML = `


    <div class="overlay-nav" aria-label="Navigation fixe en surimpression">
        <div class="bar">
            <div class="brand"><img src="/img/KhypnosLogo.png" alt="Khypnos" height="42"></div>
            <!-- Checkbox pour menu mobile -->
            <label for="menu-toggle" class="hamburger">
            <span></span><span></span><span></span>
            </label>
        
        
            <div class="hamburger-menu">
                    <div class="bar1"></div>
                    <div class="bar2"></div>
                    <div class="bar3"></div>
            </div>
            <nav class="nav-menu">
                <ul>
                    <li><a href="/index.html">Accueil</a></li>
                    <li><a href="https://www.notion.so/Espace-Priv-1eaf71268efe803f8b78cbf2cc00b75c?pvs=4">🔒 Espace Privé</a></li>
                    <li><a href="/medecin/annales/annales.html">Annales</a></li>
                    <li><a href="/medecin/qcm_khypnos.html">QCMs</a></li>
                    <li><a href="/medecin/demande_inscription.html">Inscription</a></li>
                    <li><a href="/medecin/demande_concours.html">Concours Blanc</a></li>
                    <li><a href="/medecin/demande_programme.html">Programme</a></li>
                </ul>
            </nav>
        </div>

    </div>

    `;
    

const body = document.querySelector('.body');
  if (body) {
    body.insertAdjacentHTML('afterbegin', navbarHTML);
    initNavbarFunctions();
  } else {
    // Fallback si .container absent
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
    initNavbarFunctions();
  }
}
document.addEventListener('DOMContentLoaded', loadNavbar);



function initNavbarFunctions() {
    const hamburger = document.querySelector('.hamburger-menu');
    const navMenu = document.querySelector('.nav-menu');
    const toggleBtn = document.getElementById('page-toggle');

    // Fonctionnalité hamburger
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('change');
        navMenu.classList.toggle('active');
    });

    // Fonctionnalité toggle
    toggleBtn.addEventListener('change', function() {
        // Votre logique de toggle ici
        console.log('Toggle changé:', this.checked);
    });

    // Fermer le menu en cliquant ailleurs
    document.addEventListener('click', function(event) {
        if (!navMenu.contains(event.target) && !hamburger.contains(event.target)) {
            hamburger.classList.remove('change');
            navMenu.classList.remove('active');
        }
    });
}

// Charger la navbar quand le DOM est prêt
document.addEventListener('DOMContentLoaded', loadNavbar);



// Configuration simplifiée - URLs des pages d'index uniquement
const indexUrls = {
    version1: '/index.html',
    version2: '/iade/index_iade.html'
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
    } else {
        window.location.href = indexUrls.version1;
    }
}

// Appliquer la version préférée au chargement (optionnel)
// Décommentez cette ligne si vous voulez forcer la redirection
// document.addEventListener('DOMContentLoaded', applyPreferredVersion);