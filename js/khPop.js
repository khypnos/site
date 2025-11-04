// khPop.js — lien CTA en dur, 25% scroll, compact auto, clic/scroll extérieur => compact
(function () {
	const DEFAULTS = {
		id: 'kh-pop',
		title: 'Acheter la correction de cette annale',
		text: 'Accédez à la correction complète et aux ressources associées.',
		// Lien en dur demandé:
		linkHref: '/medecin/annales/achat_corrections.html',
		linkLabel: 'Acheter la correction',
		fallbackMs: 4000,   // secours si page courte
		autoCompactMs: 3000 // délai avant réduction en bouton
	};

	let el = null;
	let stylesInjected = false;
	let compactTimer = null;
	let isShown = false;
	let currentOpts = { ...DEFAULTS };

	function scrollProgress() {
		const y = window.scrollY || window.pageYOffset || 0;
		const docH = Math.max(
			document.body.scrollHeight, document.documentElement.scrollHeight,
			document.body.offsetHeight, document.documentElement.offsetHeight,
			document.body.clientHeight, document.documentElement.clientHeight
		);
		const winH = window.innerHeight;
		const total = docH - winH;
		return total > 0 ? (y / total) : 1;
	}

	function addStyles() {
		if (stylesInjected) return;
		const css = `
:root {
	--kh-font: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
	--kh-bg: #ffffff;
	--kh-fg: #2c3e50;
	--kh-accent: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	--kh-accent-text: #ffffff;
	--kh-border: rgba(0,0,0,0.12);
	--kh-shadow: 0 8px 24px rgba(0,0,0,0.18);
	--kh-radius: 12px;
}
.kh-pop {
	position: fixed;
	left: 16px; bottom: 16px;
	max-width: min(90vw, 360px);
	background: var(--kh-bg); color: var(--kh-fg);
	border: 1px solid var(--kh-border);
	box-shadow: var(--kh-shadow);
	border-radius: var(--kh-radius);
	padding: 16px 44px 14px 16px; /* place pour le toggle */
	font-family: var(--kh-font);
	z-index: 2147483000;
	opacity: 0; transform: translateY(8px) scale(0.95);
	pointer-events: none;
	transition:
		opacity 220ms ease,
		transform 220ms ease,
		width 220ms ease,
		height 220ms ease,
		padding 220ms ease,
		border-radius 10ms ease;
}
.kh-pop.is-visible { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
.kh-pop__toggle {
	position: absolute; top: 8px; right: 8px;
	width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center;
	border: 0; background: transparent; font-size: 18px; line-height: 1; cursor: pointer; color: inherit; opacity: .85;
}
.kh-pop__toggle:hover { opacity: 1; }
.kh-pop__body { margin: 0 0 10px 0; }
.kh-pop__title { margin: 0 0 6px 0; font-size: 16px; font-weight: 700; }
.kh-pop__text { margin: 0; font-size: 14px; opacity: .9; }
.kh-pop__cta {
	display: inline-block; padding: 10px 12px;
	background: var(--kh-accent); color: var(--kh-accent-text);
	text-decoration: none; border-radius: 999px; font-weight: 600; font-size: 14px; white-space: nowrap;
}
.kh-pop__cta:hover { filter: brightness(.97); }
.kh-pop.is-compact { padding: 8px 44px 8px 10px; }
.kh-pop.is-compact .kh-pop__body { display: none; }
.kh-pop.is-compact .kh-pop__cta { padding: 8px 10px; font-size: 13px; }
@media (max-width: 360px) { .kh-pop { max-width: 92vw; } }
@media (prefers-reduced-motion: reduce) { .kh-pop { transition: none; } }
`;
		const style = document.createElement('style');
		style.id = 'kh-pop-style';
		style.textContent = css;
		document.head.appendChild(style);
		stylesInjected = true;
	}

	function ensureDom(opts) {
		if (el && document.body.contains(el)) return el;
		el = document.createElement('div');
		el.id = opts.id;
		el.className = 'kh-pop';
		el.setAttribute('role', 'dialog');
		el.setAttribute('aria-modal', 'true');
		el.setAttribute('aria-hidden', 'true');
		el.setAttribute('aria-labelledby', opts.id + '-title');
		el.innerHTML = `
<button class="kh-pop__toggle" aria-label="Réduire le popup" title="Réduire" type="button">×</button>
<div class="kh-pop__body">
	<h3 id="${opts.id}-title" class="kh-pop__title">${opts.title}</h3>
	<p class="kh-pop__text">${opts.text}</p>
</div>
<a class="kh-pop__cta" href="${opts.linkHref}" target="_self" rel="">${opts.linkLabel}</a>
`.trim();
		document.body.appendChild(el);

		// Toggle: compact <-> expand
		const toggleBtn = el.querySelector('.kh-pop__toggle');
		if (toggleBtn) {
			toggleBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				if (el.classList.contains('is-compact')) {
					expand();
				} else {
					compact();
				}
			});
		}

		// Échap => réduire
		document.addEventListener('keydown', e => {
			if (e.key === 'Escape' && isShown) compact();
		});
		// Impression => réduire
		window.addEventListener('beforeprint', compact);
		// Clic en dehors => réduire
		document.addEventListener('click', (e) => {
			if (!isShown) return;
			if (!el.contains(e.target)) compact();
		}, true);
		// Scroll => réduire
		window.addEventListener('scroll', () => {
			if (!isShown) return;
			compact();
		}, { passive: true });

		// Ne pas compacter avant que le clic CTA parte
		const cta = el.querySelector('.kh-pop__cta');
		if (cta) {
			cta.addEventListener('click', (e) => e.stopPropagation());
		}

		return el;
	}

	function expand() {
		cancelCompactTimer();
		el.classList.remove('is-compact');
		updateToggleIcon();
		scheduleCompact(currentOpts.autoCompactMs);
	}

	function compact() {
		cancelCompactTimer();
		if (!el.classList.contains('is-compact')) {
			el.classList.add('is-compact');
			updateToggleIcon();
		}
	}

	function show(opts) {
		if (!el) return;
		if (!el.classList.contains('is-visible')) {
			el.classList.add('is-visible');
			el.setAttribute('aria-hidden', 'false');
			isShown = true;
			updateToggleIcon();
			scheduleCompact(opts.autoCompactMs);
		}
	}

	function hide() {
		cancelCompactTimer();
		el.classList.remove('is-visible', 'is-compact');
		el.setAttribute('aria-hidden', 'true');
		isShown = false;
		updateToggleIcon();
	}

	function scheduleCompact(delay) {
		cancelCompactTimer();
		if (!el || !el.classList.contains('is-visible')) return;
		compactTimer = setTimeout(() => {
			if (el && el.classList.contains('is-visible')) compact();
		}, Math.max(0, Number(delay || 0)));
	}

	function cancelCompactTimer() {
		if (compactTimer) {
			clearTimeout(compactTimer);
			compactTimer = null;
		}
	}

	function updateToggleIcon() {
		const btn = el ? el.querySelector('.kh-pop__toggle') : null;
		if (!btn) return;
		if (el.classList.contains('is-compact')) {
			btn.textContent = '↗';
			btn.setAttribute('aria-label', 'Ouvrir le popup');
			btn.title = 'Ouvrir';
		} else {
			btn.textContent = '×';
			btn.setAttribute('aria-label', 'Réduire le popup');
			btn.title = 'Réduire';
		}
	}

	function boot() {
		// Permet de surcharger title/text/label via data-attributes si tu veux, sinon ignore
		let s = document.currentScript;
		if (!s) {
			const scripts = Array.from(document.getElementsByTagName('script'));
			s = scripts[scripts.length - 1];
		}
		const dataset = (s && s.dataset) ? s.dataset : {};
		currentOpts = {
			...DEFAULTS,
			// Ces trois-là restent personnalisables si tu le souhaites
			linkLabel: dataset.linkLabel || DEFAULTS.linkLabel,
			text: dataset.text || DEFAULTS.text,
			title: dataset.title || DEFAULTS.title,
			autoCompactMs: dataset.compactDelay ? Number(dataset.compactDelay) : DEFAULTS.autoCompactMs
		};

		addStyles();
		ensureDom(currentOpts);

		let fired = false;
		function onScrollTrigger() {
			if (fired) return;
			if (scrollProgress() >= 0.25) { // 25%
				fired = true;
				show(currentOpts);
				window.removeEventListener('scroll', onScrollTrigger, { passive: true });
			}
		}
		window.addEventListener('scroll', onScrollTrigger, { passive: true });

		setTimeout(function () {
			if (!fired) {
				fired = true;
				show(currentOpts);
				window.removeEventListener('scroll', onScrollTrigger, { passive: true });
			}
		}, currentOpts.fallbackMs);

		// API simple
		window.KhPop = {
			show: () => show(currentOpts),
			hide,
			expand,
			compact,
			setLink: (href, label) => {
				const a = el ? el.querySelector('.kh-pop__cta') : null;
				if (a && href) a.href = href;
				if (a && label) a.textContent = label;
			},
			setText: (text) => {
				const p = el ? el.querySelector('.kh-pop__text') : null;
				if (p && text) p.textContent = text;
			},
			setTitle: (title) => {
				const h = el ? el.querySelector('.kh-pop__title') : null;
				if (h && title) h.textContent = title;
			}
		};
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot);
	} else {
		boot();
	}
})();