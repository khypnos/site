// khPop.js — auto-détection année, thème Élégance Khypnos
(function () {

    // ── Années disponibles dans le recueil Amazon ──
    const AMAZON_YEARS = [2020, 2021, 2022, 2023, 2024, 2025];

    function detectYear() {
        const match = window.location.pathname.match(/(\d{4})/);
        return match ? parseInt(match[1], 10) : null;
    }

    function buildOpts(year) {
        if (year && AMAZON_YEARS.includes(year)) {
            return {
                id: 'kh-pop',
                title: 'Cette annale est disponible en livre',
                text: 'Recueil corrigé 2020–2025 — format papier, disponible sur Amazon.',
                linkHref: '/medecin/annales/achat_corrections.html',
                linkLabel: '📖 Voir le livre',
                fallbackMs: 4000,
                autoCompactMs: 3000
            };
        } else if (year && year < 2020) {
            const subject = encodeURIComponent(`Demande correction annale EVC ${year}`);
            const body    = encodeURIComponent(`Bonjour,\n\nJe souhaite obtenir la correction de l'annale EVC ${year}.\n\nMerci.`);
            return {
                id: 'kh-pop',
                title: `Correction de l'annale ${year}`,
                text: 'Cette annale n\'est pas dans le recueil Amazon. Contactez-nous pour l\'obtenir.',
                linkHref: `mailto:contact@khypnos.fr?subject=${subject}&body=${body}`,
                linkLabel: '📩 Demander la correction',
                fallbackMs: 4000,
                autoCompactMs: 3000
            };
        } else {
            return {
                id: 'kh-pop',
                title: 'Acheter la correction de cette annale',
                text: 'Accédez à la correction complète et aux ressources associées.',
                linkHref: '/medecin/annales/achat_corrections.html',
                linkLabel: 'Acheter la correction',
                fallbackMs: 4000,
                autoCompactMs: 3000
            };
        }
    }

    let el = null;
    let stylesInjected = false;
    let compactTimer = null;
    let isShown = false;

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
    --kh-font:         system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    --kh-navy:         #1a2f4f;
    --kh-navy-soft:    #2c4a6e;
    --kh-bg:           #ffffff;
    --kh-fg:           #1a2332;
    --kh-muted:        #5a6478;
    --kh-border:       #e8eaef;
    --kh-surface2:     #f6f7fb;
    --kh-accent-from:  #667eea;
    --kh-accent-to:    #764ba2;
    --kh-shadow:       0 4px 12px rgba(26,47,79,.08), 0 16px 40px rgba(26,47,79,.12);
    --kh-radius:       14px;
}
.kh-pop {
    position: fixed;
    left: 16px; bottom: 16px;
    max-width: min(90vw, 340px);
    background: var(--kh-bg);
    color: var(--kh-fg);
    border: 1px solid var(--kh-border);
    border-radius: var(--kh-radius);
    box-shadow: var(--kh-shadow);
    padding: 1.25rem 2.75rem 1.1rem 1.25rem;
    font-family: var(--kh-font);
    z-index: 2147483000;
    opacity: 0;
    transform: translateY(10px) scale(0.97);
    pointer-events: none;
    transition:
        opacity 240ms cubic-bezier(0.4,0,0.2,1),
        transform 240ms cubic-bezier(0.4,0,0.2,1);
}
.kh-pop::before {
    content: "";
    position: absolute;
    inset: 0 0 auto 0;
    height: 3px;
    border-radius: var(--kh-radius) var(--kh-radius) 0 0;
    background: linear-gradient(90deg, var(--kh-accent-from), var(--kh-accent-to));
}
.kh-pop.is-visible {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
}
.kh-pop__toggle {
    position: absolute;
    top: 10px; right: 10px;
    width: 26px; height: 26px;
    display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid var(--kh-border);
    border-radius: 50%;
    background: var(--kh-surface2);
    font-size: 14px; line-height: 1;
    cursor: pointer;
    color: var(--kh-muted);
    transition: background 0.15s, color 0.15s, border-color 0.15s;
    font-family: var(--kh-font);
}
.kh-pop__toggle:hover {
    background: var(--kh-navy);
    color: #fff;
    border-color: var(--kh-navy);
}
.kh-pop__body { margin: 0 0 0.85rem; }
.kh-pop__title {
    margin: 0 0 0.3rem;
    font-size: 0.95rem; font-weight: 700;
    color: var(--kh-navy);
    line-height: 1.3; letter-spacing: -0.01em;
}
.kh-pop__text {
    margin: 0;
    font-size: 0.84rem;
    color: var(--kh-muted);
    line-height: 1.5;
}
.kh-pop__cta {
    display: inline-flex; align-items: center; gap: 0.3rem;
    padding: 0.6rem 1rem;
    background: linear-gradient(135deg, var(--kh-accent-from) 0%, var(--kh-accent-to) 100%);
    color: #fff;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600; font-size: 0.875rem;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(102,126,234,.3);
    transition: filter 0.15s, transform 0.1s, box-shadow 0.15s;
    font-family: var(--kh-font);
}
.kh-pop__cta:hover {
    filter: brightness(1.06);
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(102,126,234,.4);
}
.kh-pop.is-compact {
    padding: 0;
    border: none;
    background: transparent;
    box-shadow: none;
    max-width: unset;
}
.kh-pop.is-compact::before { display: none; }
.kh-pop.is-compact .kh-pop__body,
.kh-pop.is-compact .kh-pop__cta { display: none; }
.kh-pop.is-compact .kh-pop__toggle {
    position: static;
    width: auto; height: auto;
    border-radius: 999px;
    padding: 0.5rem 0.9rem;
    font-size: 0.82rem; font-weight: 600;
    background: var(--kh-navy);
    color: #fff;
    border-color: var(--kh-navy);
    box-shadow: 0 4px 12px rgba(26,47,79,.2);
    white-space: nowrap;
}
.kh-pop.is-compact .kh-pop__toggle:hover {
    background: var(--kh-navy-soft);
    border-color: var(--kh-navy-soft);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(26,47,79,.25);
}
@media (max-width: 380px) { .kh-pop { max-width: 92vw; } }
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
<button class="kh-pop__toggle" aria-label="Réduire" title="Réduire" type="button">×</button>
<div class="kh-pop__body">
    <h3 id="${opts.id}-title" class="kh-pop__title">${opts.title}</h3>
    <p class="kh-pop__text">${opts.text}</p>
</div>
<a class="kh-pop__cta" href="${opts.linkHref}" target="_self" rel="">${opts.linkLabel}</a>`.trim();

        document.body.appendChild(el);

        const toggleBtn = el.querySelector('.kh-pop__toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                el.classList.contains('is-compact') ? expand() : compact();
            });
        }

        document.addEventListener('keydown', e => { if (e.key === 'Escape' && isShown) compact(); });
        window.addEventListener('beforeprint', compact);
        document.addEventListener('click', (e) => {
            if (!isShown) return;
            if (!el.contains(e.target)) compact();
        }, true);
        window.addEventListener('scroll', () => {
            if (!isShown) return;
            compact();
        }, { passive: true });

        const cta = el.querySelector('.kh-pop__cta');
        if (cta) cta.addEventListener('click', (e) => e.stopPropagation());

        return el;
    }

    function expand() {
        cancelCompactTimer();
        el.classList.remove('is-compact');
        updateToggleIcon();
        scheduleCompact(currentOpts && currentOpts.autoCompactMs);
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
        if (compactTimer) { clearTimeout(compactTimer); compactTimer = null; }
    }
    function updateToggleIcon() {
        const btn = el ? el.querySelector('.kh-pop__toggle') : null;
        if (!btn) return;
        if (el.classList.contains('is-compact')) {
            btn.textContent = '📖 Acheter la correction';
            btn.setAttribute('aria-label', 'Ouvrir');
            btn.title = 'Ouvrir';
        } else {
            btn.textContent = '×';
            btn.setAttribute('aria-label', 'Réduire');
            btn.title = 'Réduire';
        }
    }

    let currentOpts = null;

    function boot() {
        const year = detectYear();
        let opts   = buildOpts(year);

        let s = document.currentScript;
        if (!s) {
            const scripts = Array.from(document.getElementsByTagName('script'));
            s = scripts[scripts.length - 1];
        }
        const dataset = (s && s.dataset) ? s.dataset : {};
        currentOpts = {
            ...opts,
            linkLabel:     dataset.linkLabel    || opts.linkLabel,
            text:          dataset.text         || opts.text,
            title:         dataset.title        || opts.title,
            autoCompactMs: dataset.compactDelay ? Number(dataset.compactDelay) : opts.autoCompactMs
        };

        addStyles();
        ensureDom(currentOpts);

        let fired = false;
        function onScrollTrigger() {
            if (fired) return;
            if (scrollProgress() >= 0.25) {
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

        window.KhPop = {
            show:     () => show(currentOpts),
            hide,
            expand,
            compact,
            setLink:  (href, label) => {
                const a = el ? el.querySelector('.kh-pop__cta') : null;
                if (a && href)  a.href = href;
                if (a && label) a.textContent = label;
            },
            setText:  (text)  => { const p = el ? el.querySelector('.kh-pop__text')  : null; if (p && text)  p.textContent = text; },
            setTitle: (title) => { const h = el ? el.querySelector('.kh-pop__title') : null; if (h && title) h.textContent = title; }
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();