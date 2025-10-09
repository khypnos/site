
		(function(){
			const faq = document.getElementById('faq');
			const items = Array.from(faq.querySelectorAll('.faq-item'));

			// Ouvrir/fermer un item et fermer les autres
			function toggleItem(item){
				const isOpen = item.getAttribute('aria-expanded') === 'true';
				// fermer tous
				items.forEach(it => it.setAttribute('aria-expanded','false'));
				// ouvrir celui-ci si il n’était pas ouvert
				item.setAttribute('aria-expanded', String(!isOpen));
			}

			// Clic n’importe où sur la carte
			items.forEach(item => {
				item.addEventListener('click', (e) => {
					// éviter que la sélection de texte ou des clics profonds cassent la logique
					// mais autoriser le clic partout dans l’item
					toggleItem(item);
				});
				// Support clavier: Entrée/Espace sur l’en-tête
				const header = item.querySelector('.faq-header');
				header.addEventListener('keydown', (e) => {
					if(e.key === 'Enter' || e.key === ' '){
						e.preventDefault();
						toggleItem(item);
					}
				});
			});

			// Optionnel: ouvrir le premier par défaut
			// toggleItem(items[0]);
		})();