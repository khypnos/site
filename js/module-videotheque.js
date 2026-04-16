// ─── Module Vidéothèque YouTube ──────────────────────────────────────────────

(function () {
  // Configuration des vidéos : remplacez les IDs et textes
  const videos = [
    { youtubeId: "1O7ump5G0kI", title: "Résumé des Recommandations SFAR/HAS Sepsis 2025", sub: "Recommandations • 16 min" },
    { youtubeId: "Sd7sHXgWuFg", title: "Les courbes pression-volume : les comprendre facilement", sub: "Physiologie • 10 min" },
    { youtubeId: "9C9vGZJF2UI", title: "Douleur : Allodynie / Hyperalgésie", sub: "Douleur • 9 min" },
    { youtubeId: "AEVfOCNk4Zw", title: "Résumé des Recommandations SFAR sur l'allergie (HSI) 2025 au bloc", sub: "Recommandations • 16 min" },
  ];

  document.addEventListener("DOMContentLoaded", function () {
    const tabs    = document.querySelectorAll(".vg-tab");
    const iframe  = document.getElementById("vg-iframe");
    const titleEl = document.getElementById("vg-current-title");
    const subEl   = document.getElementById("vg-current-sub");

    if (!tabs.length || !iframe) return;

    // ← NOUVEAU : initialise tout depuis le tableau JS au chargement
    function activateTab(index) {
      const video = videos[index];
      tabs.forEach(function (t) { t.classList.remove("active"); });
      tabs[index].classList.add("active");
      titleEl.textContent = video.title;
      subEl.textContent   = video.sub;
    }

    // Initialise avec la vidéo 0 au chargement
    activateTab(0);
    iframe.src = "https://www.youtube.com/embed/" + videos[0].youtubeId + "?rel=0&modestbranding=1";

    // Met à jour les miniatures et titres des onglets depuis le JS
    tabs.forEach(function (tab, i) {
      const img = tab.querySelector(".vg-thumb");
      const title = tab.querySelector(".vg-tab-title");
      const sub   = tab.querySelector(".vg-tab-sub");
      if (img)   img.src = "https://img.youtube.com/vi/" + videos[i].youtubeId + "/mqdefault.jpg";
      if (title) title.textContent = videos[i].title;
      if (sub)   sub.textContent   = videos[i].sub;

      tab.addEventListener("click", function () {
        activateTab(i);
        iframe.src = "https://www.youtube.com/embed/" + videos[i].youtubeId + "?rel=0&modestbranding=1&autoplay=1";
      });
    });
  });
})();