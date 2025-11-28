(function(){
	// Config
	const CONFIG = {
		textHTML:
			'<strong>Dernière ligne droite</strong><br>' +
            '<strong>150 QCMs Fondamentaux</strong><br>' +
			'<p>QCMs de démonstration gratuit dans la rubrique "QCM"</p><br>'+
			'<a href="#" id="cb-link", class="back-link">S’inscrire</a>',
		linkHref: 'https://buy.stripe.com/fZudRa8TH3Kr7wA8UO4c80h',               // Remplacez par l’URL d’inscription
		autoMinimizeDelay: 4000,     // ms avant réduction auto
		storageKey: 'cb-popup-last-shown', // empreinte "YYYY-MM-DD"
		zIndex: 9999
	};

	// Utils
	function todayKey(){
		const d = new Date();
		return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
	}
	function hasShownToday(){
		try { return localStorage.getItem(CONFIG.storageKey) === todayKey(); }
		catch(e){ return false; }
	}
	function markShownToday(){
		try { localStorage.setItem(CONFIG.storageKey, todayKey()); }
		catch(e){}
	}

	// Styles
	function injectStyles(){
		if(document.getElementById('cb-popup-style')) return;
		const style = document.createElement('style');
		style.id = 'cb-popup-style';
		style.textContent = `
:root{
	--cb-bg:#111827;
	--cb-fg:#fff;
	--cb-accent:#22c55e;
	--cb-shadow:0 12px 30px rgba(0,0,0,.30);
	--cb-radius:16px;
	--cb-radius-mobile:16px 16px 0 0;
	--cb-maxw: 420px;
}

/* Overlay (pour focus/UX, pas obligatoire) */
#cb-overlay{
	position: fixed;
	inset: 0;
	background: rgba(0,0,0,.25);
	backdrop-filter: blur(1px);
	opacity: 0;
	pointer-events: none;
	transition: opacity .2s ease;
	z-index: ${CONFIG.zIndex};
}

/* Conteneur popup centré desktop, bottom-sheet mobile */
#cb-popup{
	position: fixed;
	inset: auto;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	max-width: min(var(--cb-maxw), calc(100vw - 32px));
	background: var(--cb-bg);
	color: var(--cb-fg);
	border-radius: var(--cb-radius);
	box-shadow: var(--cb-shadow);
	padding: 18px 52px 18px 18px;
	font: 15px/1.5 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
	z-index: ${CONFIG.zIndex + 1};
	transition: transform .25s ease, opacity .25s ease, height .25s ease, padding .25s ease;
}

/* Bottom sheet en mobile */
@media (max-width: 640px){
	#cb-popup{
		left: 0;
		right: 0;
		bottom: 0;
		top: auto;
		transform: none;
		width: 100vw;
		max-width: 100vw;
		border-radius: var(--cb-radius-mobile);
		padding: max(14px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
	}
}

/* État réduit */
#cb-popup.is-minimized{
	height: 0;
	padding-top: 0;
	padding-bottom: 0;
	opacity: 0;
	pointer-events: none;
}
#cb-popup a{
	color: var(--cb-accent);
	text-decoration: underline;
}
#cb-close{
	position: absolute;
	right: 8px;
	top: 8px;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	border: none;
	background: transparent;
	color: var(--cb-fg);
	font-size: 22px;
	cursor: pointer;
}

/* Pastille (toggle) */
#cb-toggle{
	position: fixed;
	left: 16px;
	bottom: 16px;
	padding: 10px 12px;
	border: none;
	border-radius: 999px;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #f3f4f6;
	font: 14px/1 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
	box-shadow: var(--cb-shadow);
	cursor: pointer;
	transition: transform .2s ease, opacity .2s ease;
	z-index: ${CONFIG.zIndex + 2};
}
#cb-toggle:active{ transform: scale(.98); }

/* Overlay visible uniquement quand le popup est ouvert */
#cb-overlay.is-active{
	opacity: 1;
	pointer-events: auto;
}
`;
		document.head.appendChild(style);
	}

	// DOM
	function createPopup(){
		if(document.getElementById('cb-popup')) return;

		// Overlay
		const overlay = document.createElement('div');
		overlay.id = 'cb-overlay';
		overlay.setAttribute('aria-hidden', 'true');

		// Popup
		const popup = document.createElement('div');
		popup.id = 'cb-popup';
		popup.setAttribute('role','dialog');
		popup.setAttribute('aria-live','polite');
		popup.setAttribute('aria-modal','true');
		popup.setAttribute('aria-label','Information concours blanc');

		const content = document.createElement('div');
		content.className = 'cb-popup__content';
		content.innerHTML = CONFIG.textHTML;

		const closeBtn = document.createElement('button');
		closeBtn.id = 'cb-close';
		closeBtn.setAttribute('aria-label','Fermer la notification');
		closeBtn.title = 'Fermer';
		closeBtn.textContent = '×';

		const toggle = document.createElement('button');
		toggle.id = 'cb-toggle';
		toggle.title = 'Concours blanc';
		toggle.setAttribute('aria-label','Réouvrir la notification');
		toggle.hidden = true;
		toggle.textContent = '📝 QCMs Fondamentaux';

		popup.appendChild(content);
		popup.appendChild(closeBtn);
		document.body.appendChild(overlay);
		document.body.appendChild(popup);
		document.body.appendChild(toggle);

		// Lien
		const link = content.querySelector('#cb-link');
		if(link && CONFIG.linkHref) link.setAttribute('href', CONFIG.linkHref);

		// États
		function minimize(){
			popup.classList.add('is-minimized');
			overlay.classList.remove('is-active');
			toggle.hidden = false;
		}
		function restore(){
			popup.classList.remove('is-minimized');
			overlay.classList.add('is-active');
			toggle.hidden = true;
		}

		// Événements
		closeBtn.addEventListener('click', minimize);
		toggle.addEventListener('click', restore);
		overlay.addEventListener('click', minimize);
		document.addEventListener('keydown', function(e){
			if(e.key === 'Escape') minimize();
		});
		if(link){
			link.addEventListener('click', function(){
				// Exemple analytics: window.gtag?.('event','click_inscription_concours_blanc');
			});
		}

		// Affichage quotidien
		if(hasShownToday()){
			minimize();
		}else{
			restore();
			setTimeout(function(){
				minimize();
				markShownToday();
			}, CONFIG.autoMinimizeDelay);
		}
	}

	// Boot
	function boot(){
		injectStyles();
		createPopup();
	}
	if(document.readyState === 'loading'){
		document.addEventListener('DOMContentLoaded', boot);
	}else{
		boot();
	}
})();