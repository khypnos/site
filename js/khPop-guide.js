// khPop-guide.js — version intrusive avec effet pulse
// Les deux paramètres à ajuster
// triggerMs: 5000,    // délai avant apparition (en ms)
// autoCompactMs: 4000 // temps d'affichage avant réduction

(function () {
  const DEFAULTS = {
    id: 'kh-pop-guide',
    title: '📖 Guide complet EVC',
    text: 'Retrouvez l\'intégralité du guide : programme, correction, méthodologie et sources.',
    linkHref: 'guide-evc.html',
    linkLabel: 'Lire le guide complet',
    triggerMs: 4000,      // apparaît après 5 secondes
    autoCompactMs: 4000   // se réduit 4 secondes après l'apparition
  };

  let el = null;
  let stylesInjected = false;
  let compactTimer = null;
  let isShown = false;
  let currentOpts = { ...DEFAULTS };
  let blockCompact = false;

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
      .kh-pop-guide {
        position: fixed;
        left: 16px; bottom: 16px;
        max-width: min(90vw, 340px);
        background: #fff; color: #2c3e50;
        border: 1px solid rgba(0,0,0,0.12);
        box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        border-radius: 12px;
        padding: 18px 44px 16px 18px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        z-index: 2147483000;

        /* état initial : invisible et légèrement en bas */
        opacity: 0;
        transform: translateY(12px) scale(0.93);
        pointer-events: none;

        /* transition de base */
        transition:
          opacity 300ms ease,
          transform 300ms ease,
          padding 250ms ease,
          box-shadow 300ms ease;
      }

      /* état visible normal */
      .kh-pop-guide.is-visible {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }

      /* ── EFFET PULSE ──
         1. scale up  → 2. scale légèrement down → 3. retour normal
         Déclenché par la classe .is-pulsing                        */
      @keyframes kh-pulse {
        0%   { transform: translateY(0) scale(1);    box-shadow: 0 8px 24px rgba(0,0,0,0.18); }
        25%  { transform: translateY(-6px) scale(1.20); box-shadow: 0 20px 48px rgba(102,126,234,0.38); }
        55%  { transform: translateY(-3px) scale(1.07); box-shadow: 0 16px 36px rgba(102,126,234,0.28); }
        80%  { transform: translateY(-1px) scale(1.015); box-shadow: 0 10px 28px rgba(0,0,0,0.2); }
        100% { transform: translateY(0) scale(1);    box-shadow: 0 8px 24px rgba(0,0,0,0.18); }
      }
      .kh-pop-guide.is-pulsing {
        animation: kh-pulse 750ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }

      /* ── BOUTON TOGGLE ── */
      .kh-pop-guide__toggle {
        position: absolute; top: 8px; right: 8px;
        width: 28px; height: 28px;
        display: inline-flex; align-items: center; justify-content: center;
        border: 0; background: transparent;
        font-size: 18px; line-height: 1;
        cursor: pointer; color: inherit; opacity: .7;
        transition: opacity 150ms;
      }
      .kh-pop-guide__toggle:hover { opacity: 1; }

      /* ── CONTENU ── */
      .kh-pop-guide__body { margin: 0 0 12px 0; }
      .kh-pop-guide__title {
        margin: 0 0 5px 0; font-size: 15px; font-weight: 700;
      }
      .kh-pop-guide__text {
        margin: 0; font-size: 13px; opacity: .85; line-height: 1.5;
      }

      /* ── BOUTON CTA ── */
      .kh-pop-guide__cta {
        display: inline-block; padding: 10px 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        text-decoration: none; border-radius: 999px;
        font-weight: 600; font-size: 14px; white-space: nowrap;
        transition: filter 150ms;
      }
      .kh-pop-guide__cta:hover { filter: brightness(.95); }

      /* ── ÉTAT COMPACT ── */
      .kh-pop-guide.is-compact {
        padding: 8px 44px 8px 10px;
      }
      .kh-pop-guide.is-compact .kh-pop-guide__body { display: none; }
      .kh-pop-guide.is-compact .kh-pop-guide__cta {
        padding: 8px 12px; font-size: 13px;
      }

      @media (max-width: 360px) { .kh-pop-guide { max-width: 92vw; } }
      @media (prefers-reduced-motion: reduce) {
        .kh-pop-guide { transition: none; }
        .kh-pop-guide.is-pulsing { animation: none; }
      }
    `;
    const style = document.createElement('style');
    style.id = 'kh-pop-guide-style';
    style.textContent = css;
    document.head.appendChild(style);
    stylesInjected = true;
  }

  function ensureDom(opts) {
    if (el && document.body.contains(el)) return el;
    el = document.createElement('div');
    el.id = opts.id;
    el.className = 'kh-pop-guide';
    el.setAttribute('role', 'complementary');
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('aria-labelledby', opts.id + '-title');
    el.innerHTML = `
      <button class="kh-pop-guide__toggle" aria-label="Réduire" title="Réduire" type="button">×</button>
      <div class="kh-pop-guide__body">
        <h3 id="${opts.id}-title" class="kh-pop-guide__title">${opts.title}</h3>
        <p class="kh-pop-guide__text">${opts.text}</p>
      </div>
      <a class="kh-pop-guide__cta" href="${opts.linkHref}" target="_self">${opts.linkLabel}</a>
    `.trim();
    document.body.appendChild(el);

    // Toggle compact <-> expand
    el.querySelector('.kh-pop-guide__toggle').addEventListener('click', e => {
      e.stopPropagation();
      el.classList.contains('is-compact') ? expand() : compact();
    });

    // Échap => compact
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isShown) compact();
    });

    // Clic extérieur => compact
    document.addEventListener('click', e => {
      if (!isShown) return;
      if (!el.contains(e.target)) compact();
    }, true);

    // Scroll => compact
    window.addEventListener('scroll', () => {
      if (!isShown) return;
      compact();
    }, { passive: true });

    // Clic CTA : ne pas déclencher compact
    el.querySelector('.kh-pop-guide__cta').addEventListener('click', e => e.stopPropagation());

    return el;
  }

  function pulse() {
    if (!el) return;
    // Retire la classe au cas où elle serait déjà là, pour forcer le re-trigger
    el.classList.remove('is-pulsing');
    // Force un reflow pour réinitialiser l'animation
    void el.offsetWidth;
    el.classList.add('is-pulsing');
    el.addEventListener('animationend', () => {
      el.classList.remove('is-pulsing');
    }, { once: true });
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
    if (!el || isShown) return;

    // Bloque le compact scroll pendant toute la durée d'affichage en grand
    blockCompact = true;
    setTimeout(() => { blockCompact = false; }, opts.autoCompactMs);

    // 1. Apparition en grand
    el.classList.remove('is-compact');   // ← garantit l'affichage grand dans tous les cas
    el.classList.add('is-visible');
    el.setAttribute('aria-hidden', 'false');
    isShown = true;
    updateToggleIcon();

    // 2. Pulse après la transition d'entrée
    setTimeout(() => { pulse(); }, 320);

    // 3. Réduction automatique après autoCompactMs
    scheduleCompact(opts.autoCompactMs);
  }

function compact() {
  if (blockCompact) return;   // ← on ignore le compact si on est en période protégée
  cancelCompactTimer();
  if (!el.classList.contains('is-compact')) {
    el.classList.add('is-compact');
    updateToggleIcon();
  }
}

  function scheduleCompact(delay) {
    cancelCompactTimer();
    if (!el || !el.classList.contains('is-visible')) return;
    compactTimer = setTimeout(() => {
      if (el && el.classList.contains('is-visible')) compact();
    }, Math.max(0, Number(delay || 0)));
  }

  function cancelCompactTimer() {
    if (compactTimer) { clearTimeout(compactTimer); compactTimer = null; }
  }

  function updateToggleIcon() {
    const btn = el ? el.querySelector('.kh-pop-guide__toggle') : null;
    if (!btn) return;
    if (el.classList.contains('is-compact')) {
      btn.textContent = '↗';
      btn.setAttribute('aria-label', 'Ouvrir');
      btn.title = 'Ouvrir';
    } else {
      btn.textContent = '×';
      btn.setAttribute('aria-label', 'Réduire');
      btn.title = 'Réduire';
    }
  }

  function boot() {
    addStyles();
    ensureDom(currentOpts);

    let fired = false;
    function trigger() {
      if (fired) return;
      fired = true;
      show(currentOpts);
      window.removeEventListener('scroll', onScroll, { passive: true });
    }

    function onScroll() {
      if (scrollProgress() >= 0.25) trigger();
    }

    // Déclencheur 1 : scroll 25%
    window.addEventListener('scroll', onScroll, { passive: true });

    // Déclencheur 2 : 5 secondes (quoi qu'il arrive)
    setTimeout(trigger, currentOpts.triggerMs);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();