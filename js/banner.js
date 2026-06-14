/* =========================================================
   Khypnos — Promo Banner Module
   Usage : <script src="/js/banner.js" defer></script>
   (à insérer juste après </head>, ou en haut du <body>)
   ========================================================= */
(function () {
  // --- Configuration centralisée ---------------------------------
  const CONFIG = {
    text: "OFFICIEL - Inscriptions EVC à partir du 17/06. Voie externe 64 places, Voie interne 201 places",
    cta: "Journal Officiel",
    url: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054245644?fbclid=IwZnRzaASaKHRleHRuA2FlbQIxMQBzcnRjBmFwcF9pZAo2NjI4NTY4Mzc5AAEenHgQ5YLw8XcIXZeHimxgtOvVSP2Z8jCcQeHkLHZxi_XGSgoWdOOZAwWx4qU_aem_kBCBbDfG5Gw_06849siMqg",
    icon: "bell",          // "sparkles" | "rocket" | "bell" | "none"
    variant: "minimal",           // "dark" | "gradient" | "minimal" | "elegance"
    dismissible: true,         // affiche une croix de fermeture
    storageKey: "khypnos_banner_joEVC" // change la clé à chaque nouvelle campagne
  };

  // --- Ne ré-affiche pas si déjà fermée --------------------------
  if (CONFIG.dismissible && localStorage.getItem(CONFIG.storageKey) === "dismissed") return;

  // --- Icônes SVG inline (pas de dépendance externe) -------------
  const ICONS = {
    sparkles: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>`,
    rocket:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,
    bell:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
    arrow:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>`,
    close:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>`
  };

  // --- Styles (3 variantes) --------------------------------------
  const STYLES = `
  .khy-banner{position:relative;width:100%;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,sans-serif;font-size:.92rem;line-height:1.4;z-index:50;animation:khy-slide .5s ease both}
  .khy-banner__inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:.75rem;padding:.7rem 3rem .7rem 1.25rem;text-align:center;flex-wrap:wrap}
  .khy-banner__icon{width:18px;height:18px;flex-shrink:0;display:inline-flex;align-items:center}
  .khy-banner__icon svg{width:100%;height:100%}
  .khy-banner__text{font-weight:500;letter-spacing:.01em}
  .khy-banner__cta{display:inline-flex;align-items:center;gap:.35rem;padding:.3rem .75rem;border-radius:999px;font-weight:600;font-size:.85rem;text-decoration:none;transition:all .2s ease;white-space:nowrap}
  .khy-banner__cta svg{width:14px;height:14px;transition:transform .2s ease}
  .khy-banner__cta:hover svg{transform:translateX(3px)}
  .khy-banner__close{position:absolute;right:.75rem;top:50%;transform:translateY(-50%);background:transparent;border:0;cursor:pointer;padding:.35rem;border-radius:6px;display:inline-flex;color:inherit;opacity:.6;transition:opacity .2s,background .2s}
  .khy-banner__close:hover{opacity:1;background:rgba(255,255,255,.1)}
  .khy-banner__close svg{width:16px;height:16px}
  @keyframes khy-slide{from{opacity:0;transform:translateY(-100%)}to{opacity:1;transform:translateY(0)}}

  /* Variante 1 — DARK (sobre, premium) */
  .khy-banner--dark{background:#0b0b0f;color:#f5f5f7;border-bottom:1px solid rgba(255,255,255,.08)}
  .khy-banner--dark .khy-banner__icon{color:#ffb86b}
  .khy-banner--dark .khy-banner__cta{background:#fff;color:#0b0b0f}
  .khy-banner--dark .khy-banner__cta:hover{background:#ffb86b;color:#0b0b0f}

  /* Variante 2 — GRADIENT (dynamique, marketing) */
  .khy-banner--gradient{background:linear-gradient(90deg,#0f0f1e 0%,#1a1f3a 50%,#0f0f1e 100%);color:#fff;border-bottom:1px solid rgba(255,255,255,.08);overflow:hidden}
  .khy-banner--gradient::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 20% 50%,rgba(255,168,107,.15),transparent 50%),radial-gradient(circle at 80% 50%,rgba(120,180,255,.12),transparent 50%);pointer-events:none}
  .khy-banner--gradient .khy-banner__icon{color:#ffb86b}
  .khy-banner--gradient .khy-banner__cta{background:rgba(255,255,255,.12);color:#fff;backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.2)}
  .khy-banner--gradient .khy-banner__cta:hover{background:#fff;color:#0f0f1e}

  /* Variante 3 — MINIMAL (très Apple/Linear) */
  .khy-banner--minimal{background:#fafafa;color:#111;border-bottom:1px solid #e5e5e5}
  .khy-banner--minimal .khy-banner__icon{color:#ff6b35}
  .khy-banner--minimal .khy-banner__cta{background:#111;color:#fff}
  .khy-banner--minimal .khy-banner__cta:hover{background:#ff6b35}
  .khy-banner--minimal .khy-banner__close:hover{background:rgba(0,0,0,.06)}

    /* Variante 4 — ELEGANCE (harmonisée thème navy médical) */
  .khy-banner--elegance{
    background:linear-gradient(180deg,#fefdfb 0%,#f9f6f0 100%);
    color:#1a2f4f;
    border-bottom:1px solid rgba(26,47,79,.08);
    box-shadow:0 1px 0 rgba(26,47,79,.03), 0 4px 14px rgba(26,47,79,.04);
  }
  .khy-banner--elegance .khy-banner__icon{color:#c89b6e}
  .khy-banner--elegance .khy-banner__text{color:#1a2f4f;font-weight:500}
  .khy-banner--elegance .khy-banner__cta{
    background:#1a2f4f;
    color:#fff;
    box-shadow:0 2px 8px rgba(26,47,79,.2)
  }
  .khy-banner--elegance .khy-banner__cta:hover{
    background:#2c4a6e;
    box-shadow:0 4px 14px rgba(26,47,79,.3)
  }
  .khy-banner--elegance .khy-banner__close:hover{background:rgba(26,47,79,.06)}

  @media (max-width:640px){
    .khy-banner__inner{font-size:.85rem;padding:.6rem 2.5rem .6rem 1rem;gap:.5rem}
    .khy-banner__cta{font-size:.78rem;padding:.25rem .6rem}
  }
  `;

  // --- Injection du CSS ------------------------------------------
  const styleEl = document.createElement("style");
  styleEl.id = "khy-banner-styles";
  styleEl.textContent = STYLES;
  document.head.appendChild(styleEl);

  // --- Construction du DOM ---------------------------------------
  const banner = document.createElement("div");
  banner.className = `khy-banner khy-banner--${CONFIG.variant}`;
  banner.setAttribute("role", "region");
  banner.setAttribute("aria-label", "Annonce promotionnelle");

  const iconHtml = CONFIG.icon && CONFIG.icon !== "none"
    ? `<span class="khy-banner__icon" aria-hidden="true">${ICONS[CONFIG.icon] || ""}</span>`
    : "";

  banner.innerHTML = `
    <div class="khy-banner__inner">
      ${iconHtml}
      <span class="khy-banner__text">${CONFIG.text}</span>
      <a class="khy-banner__cta" href="${CONFIG.url}" target="_blank" rel="noopener">
        ${CONFIG.cta}${ICONS.arrow}
      </a>
    </div>
    ${CONFIG.dismissible ? `<button class="khy-banner__close" aria-label="Fermer">${ICONS.close}</button>` : ""}
  `;

  // --- Insertion en tête de <body> -------------------------------
  document.body.insertBefore(banner, document.body.firstChild);

  // --- Gestion fermeture -----------------------------------------
  if (CONFIG.dismissible) {
    banner.querySelector(".khy-banner__close").addEventListener("click", () => {
      banner.style.animation = "khy-slide .3s ease reverse forwards";
      setTimeout(() => banner.remove(), 280);
      localStorage.setItem(CONFIG.storageKey, "dismissed");
    });
  }
})();