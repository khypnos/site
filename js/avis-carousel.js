// /js/avis-carousel.js
document.addEventListener("DOMContentLoaded", () => {
  const slider = document.getElementById("avisSlider");
  if (!slider) return;

  // ⚙️ Dnnées — ajouter les avis
  // "date" = la date approximative de publication de l'avis (YYYY-MM-DD).
  // L'ancienneté affichée se met à jour automatiquement avec le temps.
  const REVIEWS = [
    {
      author: "Mouna N.",
	  rating: 5,                  
      date: "2026-04-22",              
      text: "Je tiens à remercier toute l'équipe Khypnos pour l'effort fourni et la qualité de la formation que vous proposez. Cela a été une aide énorme pour moi, notamment grâce à vos conseils et à votre accompagnement."
    },
    {
      author: "Chloé D.",
      rating: 5,
      date: "2026-04-12",                  
      text: "Accompagnement d'une grande qualité, l'équipe est à l'écoute et est très disponible. Je conseille fortement cette préparation aux concours !"
    },
    {
      author: "Zara J.",
      rating: 5,
      date: "2026-03-29",                 
      text: "Je tiens à adresser à l'équipe Khypnos mes plus sincères remerciements pour la qualité de leur accompagnement, leur engagement et leur soutien tout au long de cette formation."
    },
    {
      author: "Ariane B.",
      rating: 5,
      date: "2026-03-29",
      text: "Excellente préparation, à l'écoute, réactive et personnalisée. Un grand merci à Baptiste et à Arnaud pour leur accompagnement !"
    },
	{
      author: "Adila M.",
      rating: 5,
      date: "2026-03-29",
      text: "Note 5/5"
    }
    // ➕ Ajoute ici de nouveaux avis quand tu en auras
  ];

  // Lien "Voir tous les avis" (optionnel)
  const ALL_REVIEWS_URL = "https://www.google.com/maps/place/Khypnos/@48.8542048,2.3629798,17z/data=!4m8!3m7!1s0x47e671ea8da5277b:0x6b9097defdc70ec5!8m2!3d48.8542048!4d2.3643838!9m1!1b1!16s%2Fg%2F11nb5y6vj8";

  // ----------- Helpers -----------
  const escapeHtml = s => (s || "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));

  const stars = n => {
    const k = Math.max(0, Math.min(5, Math.round(n || 0)));
    return "★".repeat(k) + "☆".repeat(5 - k);
  };

  // "il y a X jours / semaines / mois / années"
  const timeAgo = (isoDate) => {
    const d = new Date(isoDate);
    if (isNaN(d)) return "";
    const diffMs = Date.now() - d.getTime();
    const day = 24 * 60 * 60 * 1000;
    const days = Math.floor(diffMs / day);

    if (days < 1)   return "aujourd'hui";
    if (days === 1) return "il y a 1 jour";
    if (days < 7)   return `il y a ${days} jours`;

    const weeks = Math.floor(days / 7);
    if (weeks === 1) return "il y a 1 semaine";
    if (weeks < 5)   return `il y a ${weeks} semaines`;

    const months = Math.floor(days / 30);
    if (months === 1) return "il y a 1 mois";
    if (months < 12)  return `il y a ${months} mois`;

    const years = Math.floor(days / 365);
    return years === 1 ? "il y a 1 an" : `il y a ${years} ans`;
  };

  const renderItem = r => `
    <div class="avis-item">
      <div class="avis-content">
        <div>
          <div class="avis-stars" aria-label="${r.rating} étoiles sur 5">${stars(r.rating)}</div>
          <div class="avis-text">"${escapeHtml(r.text)}"</div>
        </div>
        <div class="avis-author">— ${escapeHtml(r.author)} · <span class="avis-date" data-date="${r.date}">${timeAgo(r.date)}</span></div>
      </div>
    </div>
  `;

  // ----------- Rendu -----------
  if (!REVIEWS.length) { slider.innerHTML = ""; return; }

  const html = REVIEWS.map(renderItem).join("");
  // Duplication pour le ruban infini (l'animation va de 0 à -50%)
  slider.innerHTML = html + html;

  // Lien "voir tous"
  const allLink = document.getElementById("avisAllLink");
  if (allLink) allLink.href = ALL_REVIEWS_URL;

  // Durée d'animation proportionnelle au contenu (~80 px/s)
  const halfWidth = slider.scrollWidth / 2;
  const duration = Math.max(20, Math.round(halfWidth / 80));
  slider.style.setProperty("--scroll-duration", duration + "s");

  // Met à jour l'ancienneté toutes les heures (au cas où la page reste ouverte longtemps)
  setInterval(() => {
    document.querySelectorAll(".avis-date").forEach(el => {
      el.textContent = timeAgo(el.dataset.date);
    });
  }, 60 * 60 * 1000);
});