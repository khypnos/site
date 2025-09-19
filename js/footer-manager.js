class FooterManager {
	constructor({ anchor = 'body', position = 'beforeend', social = {} } = {}) {
		this.footer = null;
		this.anchor = anchor;     // sélecteur CSS d’ancrage
		this.position = position; // 'beforebegin' | 'afterbegin' | 'beforeend' | 'afterend'
		// URLs réseaux (facultatif). Laisse vide pour masquer un réseau.
		this.social = {
			youtube: social.youtube || 'https://www.youtube.com/@khypnos',   // <-- remplace si besoin
			facebook: social.facebook || 'https://www.facebook.com/p/Khypnos-61573689777722/',  // <-- remplace si besoin
			linkedin: social.linkedin || 'https://www.linkedin.com/company/khypnos', // <-- remplace si besoin
		};
	}

	init() {
		this.removeExistingFooters();
		this.createFooter();
		this.injectSocialSection();   // <-- Ajout réseaux
		this.addStyles();
		this.mountAtAnchor();         // <-- localisation ici
		this.handleResponsive?.();
	}

	removeExistingFooters() {
		document.querySelectorAll('footer.footer, footer.khypnos-footer').forEach(el => el.remove());
	}

	createFooter() {
		this.footer = document.createElement('footer');
		this.footer.className = 'khypnos-footer';
		this.footer.setAttribute('role', 'contentinfo');
		this.footer.innerHTML = `
			<div class="footer-container">
				<div class="footer-section">
					<h4>Formations</h4>
					<a href="/medecin/la_prepa_khypnos.html">Formations EVC</a>
					<a href="/medecin/webinaires.html">Webinaires gratuits</a>
					<a href="/medecin/qcm_khypnos.html">Plateforme QCM</a>
					<a href="/medecin/demande_concours.html">Concours blancs</a>
				</div>
				<div class="footer-section">
					<h4>Informations</h4>
					<a href="/cgv.html">Conditions générales de vente</a>
					<a href="/mentions_legales.html">Mentions légales</a>
				</div>
				<!-- La section Réseaux est injectée dynamiquement -->
			</div>
			<div class="footer-bottom">
				<p>&copy; 2025 Khypnos - Tous droits réservés</p>
			</div>
		`;
		// IMPORTANT: plus d'append ici
	}

	// Injection de la section "Réseaux" si au moins un lien est défini
	injectSocialSection() {
		const container = this.footer?.querySelector('.footer-container');
		if (!container) return;

		// Construit les liens présents
		const items = [];
		if (this.social.youtube) {
			items.push(`
				<a class="social-link" href="${this.social.youtube}" target="_blank" rel="noopener" aria-label="Chaîne YouTube Khypnos">
					<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<path fill="currentColor" d="M23.5 6.2a4 4 0 0 0-2.8-2.8C18.9 3 12 3 12 3s-6.9 0-8.7.4A4 4 0 0 0 .5 6.2 41.4 41.4 0 0 0 0 12c0 5.8.5 5.8.5 5.8a4 4 0 0 0 2.8 2.8C5.1 21 12 21 12 21s6.9 0 8.7-.4a4 4 0 0 0 2.8-2.8c.4-1.8.5-5.8.5-5.8s0-4-.5-5.8ZM9.6 15.5v-7l6.4 3.5-6.4 3.5Z"/>
					</svg>
					<span>YouTube</span>
				</a>
			`.trim());
		}
		if (this.social.facebook) {
			items.push(`
				<a class="social-link" href="${this.social.facebook}" target="_blank" rel="noopener" aria-label="Page Facebook Khypnos">
					<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<path fill="currentColor" d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2.7V12h2.7V9.7c0-2.7 1.6-4.2 4-4.2 1.2 0 2.4.2 2.4.2v2.6h-1.3c-1.3 0-1.7.8-1.7 1.6V12h3l-.5 2.9h-2.5v7A10 10 0 0 0 22 12Z"/>
					</svg>
					<span>Facebook</span>
				</a>
			`.trim());
		}
		if (this.social.linkedin) {
			items.push(`
				<a class="social-link" href="${this.social.linkedin}" target="_blank" rel="noopener" aria-label="Page LinkedIn Khypnos">
					<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 0 0 5.001 2.5 2.5 0 0 0 0-5Zm.02 6H2v11h3V9.5ZM9 9.5H6v11h3v-6c0-1.6.7-2.6 2.1-2.6 1.3 0 1.9.9 1.9 2.6v6h3v-6.9c0-3-1.6-4.4-3.8-4.4-1.8 0-2.6 1-3.1 1.7V9.5Z"/>
					</svg>
					<span>LinkedIn</span>
				</a>
			`.trim());
		}

		if (!items.length) return; // aucun réseau fourni

		const section = document.createElement('div');
		section.className = 'footer-section';
		section.innerHTML = `
			<h4>Réseaux</h4>
			<div class="social-links">
				${items.join('\n')}
			</div>
		`;
		container.appendChild(section);
	}

	// NOUVEAU: localisation contrôlée
	mountAtAnchor() {
		const target = document.querySelector(this.anchor);
		if (target) {
			target.insertAdjacentElement(this.position, this.footer);
			return;
		}
		// Fallback: insère en fin de body si l’ancre n’existe pas
		document.body.insertAdjacentElement('beforeend', this.footer);
	}

	addStyles() {
		if (document.getElementById('khypnos-footer-styles')) return;
		const style = document.createElement('style');
		style.id = 'khypnos-footer-styles';
		style.textContent = `
.khypnos-footer {
	--fz-base: clamp(12px, 1.6vw, 14px);   /* taille du texte */
	--fz-small: clamp(10px, 1.2vw, 12px);  /* légendes, small */
	--fz-h4:   clamp(13px, 1.8vw, 15px);   /* titres de section */
	--lh-base: 1.35;
	--lh-tight: 1.2;
	background: #2c3e50;
	color: #fff;
	padding: 16px 16px 16px;
	margin-top: 10px;
	border-radius: 12px;
	font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
	box-shadow: 0 -5px 15px rgba(0,0,0,0.1);
	font-size: var(--fz-base);
	line-height: var(--lh-base);
}
/* Layout */
.footer-container {
	display: flex;
	justify-content: space-between;
	flex-wrap: wrap;
	max-width: 1200px;
	margin: 0 auto;
	gap: 10px;
}
.footer-section {
	flex: 1;
	min-width: 220px; /* un peu plus petit qu'avant */
	margin-bottom: 8px;
}
/* Titres + textes + liens, tailles harmonisées */
.footer-section h4 {
	margin-bottom: 8px;
	font-size: var(--fz-h4);
	font-weight: 700;
	color: #ffffff;
	border-bottom: 1.5px solid rgba(255,255,255,0.3);
	padding-bottom: 6px;
	text-align: center;
	line-height: var(--lh-tight);
}
.footer-section p {
	margin-bottom: 6px;
	line-height: var(--lh-base);
	color: rgba(255,255,255,0.9);
	font-size: var(--fz-base);
}
.footer-section a {
	color: rgba(255,255,255,0.85);
	text-decoration: none;
	display: block;
	margin-bottom: 4px;
	padding: 4px 0;
	transition: all 0.25s ease;
	border-left: 3px solid transparent;
	padding-left: 8px;
	text-align: center;
	font-size: var(--fz-base);
}
.footer-section a:hover {
	color: #ffffff;
	transform: translateX(4px);
	text-decoration: underline;
}
/* Réseaux */
/* Réseaux */
.footer-section .social-links {
	display: flex;
	flex-direction: column;   /* empile en desktop */
	gap: 8px;
	align-items: center;
	justify-content: center;
	flex-wrap: nowrap;
	margin-top: 8px;
}
.khypnos-footer .social-link {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 8px 10px;
	border-radius: 8px;
	color: #e7e7e7;
	background: rgba(255,255,255,0.06);
	text-decoration: none;
	transition: background .2s, transform .1s, color .2s;
	border: 1px solid rgba(255,255,255,0.08);
	transform: scale(.8); /* 80% */
	transform-origin: center;
}
.khypnos-footer .social-link:hover {
	background: rgba(255,255,255,0.12);
	transform: scale(.8) translateY(-1px); /* conserve l’échelle au hover */
	color: #fff;
}
.khypnos-footer .social-link svg { color: currentColor; }

/* Responsif (si tu veux revenir en ligne sur mobile/tablette) */
@media (max-width: 992px) {
	.footer-section .social-links {
		flex-direction: row;   /* en ligne sur écrans plus petits */
		flex-wrap: wrap;
		gap: 10px;
	}
}

/* Bas de page */
.footer-bottom {
	text-align: center;
	padding-top: 6px;
	border-top: 1px solid rgba(255,255,255,0.2);
	margin-top: 6px;
}
.footer-bottom p {
	margin-bottom: 6px;
	font-size: var(--fz-base);
}
.footer-bottom small {
	opacity: 0.85;
	font-style: italic;
	font-size: var(--fz-small);
}

/* Responsif */
@media (max-width: 992px) {
	.footer-section .social-links {
		flex-direction: row;   /* en ligne sur écrans plus petits */
		flex-wrap: wrap;
		gap: 10px;
	}
}
@media (max-width: 768px) {
	.khypnos-footer { padding: 16px 14px 14px; margin-top: 12px; }
	.footer-section { min-width: 100%; }
}
@media (max-width: 480px) {
	.khypnos-footer { padding: 14px 10px 12px; }
	.footer-container { gap: 8px; }
}
		`;
		document.head.appendChild(style);
	}

	handleResponsive() {
		const handleResize = () => {
			const width = window.innerWidth;
			if (this.footer) {
				if (width < 768) this.footer.classList.add('mobile-view');
				else this.footer.classList.remove('mobile-view');
			}
		};
		window.addEventListener('resize', handleResize);
		handleResize();
	}

	remove() {
		if (this.footer) {
			this.footer.remove();
			this.footer = null;
		}
		const styles = document.getElementById('khypnos-footer-styles');
		if (styles) styles.remove();
	}
}

// Export CommonJS (facultatif)
if (typeof module !== 'undefined' && module.exports) {
	module.exports = FooterManager;
}