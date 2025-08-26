// navbar.js
function loadNavbar() {
    const navbarHTML = `
	 <div class="bar">
		<div class="brand"><img src="../../img/KhypnosLogo.png" alt="Khypnos" height="42"></div>
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
					<li><a href="../index.html">Accueil</a></li>
					<li><a href="../annales/annales.html">Annales</a></li>
					<li><a href="../demande_inscription.html">Inscription</a></li>
					<li><a href="../demande_concours.html">Concours Blanc</a></li>
					<li><a href="../demande_programme.html">Programme</a></li>
				</ul>
			</nav>
	</div>
    `;
    
    // Insérer la navbar au début du body
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
    
    // Initialiser les fonctionnalités après insertion
    initNavbarFunctions();
}

		function initNavbarFunctions() {
    const hamburger = document.querySelector('.hamburger-menu');
    const navMenu = document.querySelector('.nav-menu');

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
