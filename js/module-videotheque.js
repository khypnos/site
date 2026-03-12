// ─── Module Vidéothèque YouTube ──────────────────────────────────────────────

(function () {
  // Configuration des vidéos : remplacez les IDs et textes
  const videos = [
    { youtubeId: "1O7ump5G0kI", title: "Résumé des Recommandations SFAR/HAS Sepsis 2025", sub: "Recommandations • 16 min" },
    { youtubeId: "9C9vGZJF2UI", title: "Douleur : Allodynie / Hyperalgésie", sub: "Douleur • 9 min" },
    { youtubeId: "Sd7sHXgWuFg", title: "Bêta-bloquants : Comment agissent-ils sur le cœur ?", sub: "Pharmacologie • 12 min" },
    { youtubeId: "AEVfOCNk4Zw", title: "Résumé des Recommandations SFAR sur l'allergie (HSI) 2025 au bloc", sub: "Recommandations • 16 min" },
  ];

  document.addEventListener("DOMContentLoaded", function () {
    const tabs    = document.querySelectorAll(".vg-tab");
    const iframe  = document.getElementById("vg-iframe");
    const titleEl = document.getElementById("vg-current-title");
    const subEl   = document.getElementById("vg-current-sub");

    if (!tabs.length || !iframe) return;

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        const index = parseInt(tab.getAttribute("data-index"), 10);
        const video = videos[index];

        // Mettre à jour l'onglet actif
        tabs.forEach(function (t) { t.classList.remove("active"); });
        tab.classList.add("active");

        // Mettre à jour le lecteur
        iframe.src = "https://www.youtube.com/embed/" + video.youtubeId + "?rel=0&modestbranding=1&autoplay=1";
        titleEl.textContent = video.title;
        subEl.textContent   = video.sub;
      });
    });
  });
})();