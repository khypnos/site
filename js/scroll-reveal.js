(function () {
	// Respecte prefers-reduced-motion
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const els = document.querySelectorAll('[data-reveal]');

	// Prépare les classes et l'alternance
	els.forEach((el, i) => {
		// Direction auto si non précisée
		if (!el.dataset.reveal || (el.dataset.reveal !== 'left' && el.dataset.reveal !== 'right')) {
			el.dataset.reveal = i % 2 === 0 ? 'left' : 'right';
		}
		el.classList.add('reveal', el.dataset.reveal === 'left' ? 'from-left' : 'from-right');
	});

	// Gestion du "stagger": on applique un délai progressif sur les enfants
	// data-stagger sur un conteneur active l'effet
	// data-stagger-step (ms) personnalise l'intervalle (par défaut 90ms)
	const staggerContainers = document.querySelectorAll('[data-stagger]');
	staggerContainers.forEach(container => {
		const step = Number(container.dataset.staggerStep || 90);
		// Cible par défaut: enfants directs. Pour un ciblage fin, utilisez data-stagger-target=".offer, .column"
		const targetSelector = container.dataset.staggerTarget || ':scope > *';
		const items = Array.from(container.querySelectorAll(targetSelector));

		items.forEach((item, idx) => {
			// On n’écrase pas des transitions existantes: on ne fixe que delay
			item.style.transitionDelay = `${idx * step}ms`;
			// Si l’item n’a pas déjà data-reveal, on hérite du conteneur pour garder une direction cohérente
			if (!item.hasAttribute('data-reveal')) {
				item.setAttribute('data-reveal', container.dataset.reveal || (idx % 2 === 0 ? 'left' : 'right'));
				item.classList.add('reveal', item.dataset.reveal === 'left' ? 'from-left' : 'from-right');
			}
		});
	});

	// Si reduced motion: on affiche tout directement et on sort
	if (reduce) {
		document.querySelectorAll('.reveal').forEach(el => {
			el.classList.add('visible');
			el.style.transitionDelay = '0ms';
		});
		return;
	}

	// Intersection Observer
	const io = new IntersectionObserver((entries, obs) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				entry.target.classList.add('visible');
				obs.unobserve(entry.target);
			}
		});
	}, {
		root: null,
		rootMargin: '0px 0px -10% 0px',
		threshold: 0.15
	});

	document.querySelectorAll('.reveal').forEach(el => io.observe(el));
})();