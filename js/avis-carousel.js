document.addEventListener('DOMContentLoaded', () => {
	const container = document.querySelector('.avis-container');
	const slider = document.getElementById('avisSlider');
	if (!container || !slider) return;

	// Duplique les items existants (déjà présents en HTML) pour créer un ruban infini
	const initialItems = Array.from(slider.children);
	initialItems.forEach(node => slider.appendChild(node.cloneNode(true)));

	// Calcule la distance de scroll en fonction de la moitié (ensemble original)
	function setScrollDistance() {
		const halfWidth = Array.from(slider.children)
			.slice(0, initialItems.length)
			.reduce((acc, el) => acc + el.getBoundingClientRect().width, 0);
		slider.style.setProperty('--scroll-distance', `-${halfWidth}px`);
		// Vitesse ~100 px/s (ajustez si besoin)
		const pxPerSec = 100;
		const duration = Math.max(10, Math.round(halfWidth / pxPerSec));
		slider.style.setProperty('--scroll-duration', `${duration}s`);
	}
	setScrollDistance();
	window.addEventListener('resize', setScrollDistance, { passive: true });

	let autoplay = true;
	let resumeTimer = null;
	function pauseAutoplay() {
		if (!autoplay) return;
		autoplay = false;
		slider.style.setProperty('--play-state', 'paused');
	}
	function resumeAutoplay(afterMs = 1500) {
		clearTimeout(resumeTimer);
		resumeTimer = setTimeout(() => {
			autoplay = true;
			slider.style.setProperty('--play-state', 'running');
		}, afterMs);
	}

	// Drag / swipe
	let isDown = false, startX = 0, currentTranslate = 0, prevTranslate = 0;
	let lastPointerX = 0, velocity = 0, lastTs = 0, rafId = null;

	function getTranslateX() {
		const t = getComputedStyle(slider).transform;
		if (t === 'none') return 0;
		const m = new DOMMatrixReadOnly(t);
		return m.m41;
	}
	function setTranslateX(x) {
		slider.style.transform = `translateX(${x}px)`;
	}
	function wrapTranslate(x) {
		const halfWidth = Math.abs(parseFloat(getComputedStyle(slider).getPropertyValue('--scroll-distance'))) || 0;
		if (!halfWidth) return x;
		while (x <= -halfWidth) x += halfWidth;
		while (x > 0) x -= halfWidth;
		return x;
	}

	function pointerDown(clientX) {
		pauseAutoplay();
		isDown = true;
		container.classList.add('is-dragging');
		cancelAnimationFrame(rafId);
		startX = clientX;
		slider.style.animation = 'none';
		const current = getTranslateX();
		currentTranslate = isNaN(current) ? 0 : current;
		prevTranslate = currentTranslate;
		lastPointerX = clientX;
		lastTs = performance.now();
		velocity = 0;
	}
	function pointerMove(clientX) {
		if (!isDown) return;
		const dx = clientX - startX;
		const now = performance.now();
		const dt = Math.max(1, now - lastTs);
		const vx = (clientX - lastPointerX) / dt;
		velocity = vx;
		lastPointerX = clientX;
		lastTs = now;
		currentTranslate = wrapTranslate(prevTranslate + dx);
		setTranslateX(currentTranslate);
	}
	function kineticScroll() {
		const friction = 0.95, minVelocity = 0.02;
		let last = performance.now();
		function step() {
			const now = performance.now();
			const dt = now - last;
			last = now;
			currentTranslate = wrapTranslate(currentTranslate + velocity * dt);
			setTranslateX(currentTranslate);
			velocity *= friction;
			if (Math.abs(velocity) > minVelocity) {
				rafId = requestAnimationFrame(step);
			} else {
				cancelAnimationFrame(rafId);
				container.classList.remove('is-dragging');
				// Reprise de l’animation CSS
				slider.style.transform = '';
				slider.style.animation = '';
				requestAnimationFrame(() => resumeAutoplay(1200));
			}
		}
		step();
	}
	function pointerUp() {
		if (!isDown) return;
		isDown = false;
		kineticScroll();
	}

	// Souris
	container.addEventListener('mousedown', e => { e.preventDefault(); pointerDown(e.clientX); });
	window.addEventListener('mousemove', e => pointerMove(e.clientX));
	window.addEventListener('mouseup', pointerUp);

	// Tactile
	container.addEventListener('touchstart', e => pointerDown(e.touches[0].clientX), { passive: true });
	container.addEventListener('touchmove', e => pointerMove(e.touches[0].clientX), { passive: true });
	container.addEventListener('touchend', pointerUp);
	container.addEventListener('touchcancel', pointerUp);

	// Pause/reprise au survol (desktop)
	container.addEventListener('mouseenter', pauseAutoplay);
	container.addEventListener('mouseleave', () => resumeAutoplay(500));
});
