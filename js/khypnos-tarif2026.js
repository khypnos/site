function renderKhypnosOffers2026() {
  return `
    <h2 class="section-title">Formations 2026</h2>

    <!-- Toggle Voie (placé ici, sous "Formations 2026") -->
    <div class="offers-toggle" role="tablist" aria-label="Choix de la voie">
      <button type="button" role="tab"
        aria-selected="true"
        aria-controls="offers-panel-externe"
        id="offers-tab-externe"
        class="is-active">
        Voie externe
      </button>

      <button type="button" role="tab"
        aria-selected="false"
        aria-controls="offers-panel-interne"
        id="offers-tab-interne">
        Voie interne
      </button>

      <span class="offers-toggle__thumb" aria-hidden="true"></span>
    </div>

    <div class="offers-panels">

      <!-- ===================== -->
      <!-- VOIE EXTERNE  -->
      <!-- ===================== -->
      <div id="offers-panel-externe" role="tabpanel" aria-labelledby="offers-tab-externe">
        <div class="column">
          <h3>Offre de Formation 2026</h3>
          <ul class="feature-list">
            <li><span class="emoji">📅</span>Inscriptions de Février 2026 à Juin 2026</li>
            <li>
              <span class="emoji">📝</span>
              <a href="/medecin/demande_concours.html" class="souschap" rel="noopener noreferrer">
                Concours Blanc Khypnos
              </a> au sein d'une formule ou en stand-alone
            </li>
            <li><span class="emoji">💻</span>Formation en <strong>distanciel</strong></li>
            <li>Formation complète : Enseignements les <strong>Mercredi soir</strong> et <strong>Samedi après-midi</strong></li>
            <li><span class="emoji">📆</span>Période : Juin à Octobre 2026</li>
            <li><span class="emoji">💳</span>Paiement en <strong>4 mensualités</strong> disponible</li>
            <li><span class="emoji">🟢</span><strong>Remboursement</strong> des "Formations" <strong>dans les 30 premiers jours</strong> si non adapté à tes besoins</li>
          </ul>
        </div>

        <h2 class="section-title">Tarifs Voie Externe 2026</h2>
        <p style="margin-top:-10px; margin-bottom:20px; text-align: justify;">
          Les tarifs sont indiqués en TTC. Certaines formules sont proposées à la fois en paiement intégral et en 4 mensualités (sans frais).
        </p>

        <section class="offers">
          <div class="payment-options">

            <!-- Concours blanc voie externe -->
            <article class="payment-card featured">
              <h3>Concours blanc<br>Voie Externe</h3>
              <div class="payment-price">120€ TTC</div>
              <ul class="payment-features">
                <li><span style="color: #28a745">✓</span> <strong>Format rédactionnel</strong> (EVCF/EVCP)</li>
                <li><span style="color: #28a745">✓</span> Correction en session interactive</li>
                <li><span style="color: #28a745">✓</span> Conseils méthodologiques</li>
              </ul>
              <a class="primary-btn" href="https://buy.stripe.com/4gMfZi6Lz80HeZ26MG4c80k" target="_blank">S’inscrire</a>
            </article>

            <!-- Annales VE -->
            <article class="payment-card">
              <h3>Formation annales<br>Voie Externe</h3>
              <div class="payment-price">1300€ TTC</div>
              <ul class="payment-features">
                <li><span style="color: #28a745">✓</span> Sessions de correction d'annales en direct</li>
                <li><span style="color: #28a745">✓</span> Session "nouvelles recommandations"</li>
                <li><span style="color: #dc3545">✗</span> Pas d'accès aux cours Khypnos</li>
                <li><span style="color: #dc3545">✗</span> Pas d'accès aux concours blancs</li>
                <li><span style="color: #dab61a">✓</span> Accès aux formateurs Khypnos par mail</li>
              </ul>
              <a class="primary-btn" href="https://buy.stripe.com/7sY3cw2vjep53gkfjc4c80l" target="_blank">S’inscrire</a>
            </article>

            <!-- Complète VE -->
            <article class="payment-card offer-card offer--full">
              <div class="payment-badge">⭐ Recommandé</div>
              <h3>Formation complète<br>Voie Externe</h3>
              <div class="payment-price">1800€ TTC</div>
              <ul class="payment-features">
                <li><strong>Formation la plus complète</strong></li>
                <li><span style="color: #28a745">✓</span> Sessions de correction d'annales en direct</li>
                <li><span style="color: #28a745">✓</span> Correction de copie et conseils méthodologiques</li>
                <li><span style="color: #28a745">✓</span> Accès immédiat aux vidéos de formation Khypnos : 30h de cours couvrant tout le programme</li>
                <li><span style="color: #28a745">✓</span> Session "nouvelles recommandations"</li>
                <li><span style="color: #28a745">✓</span> 2 concours blancs inclus</li>
                <li><span style="color: #28a745">✓</span> Groupe Whatsapp avec les formateurs Khypnos</li>
                <li><span style="color: #28a745">✓</span> 10 places ouvertes</li>
              </ul>
              <a class="primary-btn" href="https://buy.stripe.com/dRmaEY6Lzft95os8UO4c80m" target="_blank">S’inscrire</a>
            </article>

          </div>
        </section>

      </div>

      <!-- ===================== -->
      <!-- VOIE INTERNE  -->
      <!-- ===================== -->
      <div id="offers-panel-interne" role="tabpanel" aria-labelledby="offers-tab-interne" hidden>
        <div class="column">
          <h3>Offre de Formation 2026</h3>
          <ul class="feature-list">
            <li><span class="emoji">📅</span>Inscriptions de Février 2026 à Août 2026</li>
            <li>
              <span class="emoji">📝</span>
              <a href="/medecin/demande_concours.html" class="souschap" rel="noopener noreferrer">
                Concours Blanc Khypnos
              </a> au sein d'une formule ou en stand-alone
            </li>
            <li><span class="emoji">💻</span>Formation en <strong>distanciel</strong></li>
            <li>Formation complète : Enseignements intensifs sur 4 à 6 semaines les <strong>Mercredi soir</strong> et <strong>Samedi après-midi</strong></li>
            <li><span class="emoji">📆</span>Période : Septembre - Octobre 2026</li>
            <li><span class="emoji">💳</span>Paiement en <strong>4 mensualités</strong> disponible</li>
            <li><span class="emoji">🟢</span><strong>Remboursement</strong> des "Formations" <strong>dans les 30 premiers jours</strong> si non adapté à tes besoins</li>
          </ul>
        </div>

        <h2 class="section-title">Tarifs Voie Interne 2026</h2>
        <p style="margin-top:-10px; margin-bottom:20px; text-align: justify;">
          Les tarifs sont indiqués en TTC. Les formules sont directement proposé à l'achat dans l'application QCM Khypnos.
        </p>

        <section class="offers">
          <div class="payment-options">

            <!-- Concours blanc voie interne -->
            <article class="payment-card featured">
              <h3>Concours blanc<br>Voie Interne</h3>
              <div class="payment-price">120€ TTC</div>
              <ul class="payment-features">
                <li><span style="color: #28a745">✓</span> <strong>Format QCM</strong></li>
                <li><span style="color: #28a745">✓</span> <strong>Physiologie</strong> et <strong>Pharmacologie</strong></li>
                <li><span style="color: #28a745">✓</span> Correction en session interactive</li>
                <li><span style="color: #28a745">✓</span> Conseils méthodologiques QCMs</li>
                <li><span style="color: #28a745">✓</span> Créer un compte gratuitement pour accéder aux QCMs gratuits</li>
              </ul>
              <a class="primary-btn" href="https://khypnos-qcm.vercel.app/" target="_blank">Acheter dans l'application</a>
            </article>

            <!-- Annales VE -->
            <article class="payment-card">
              <h3>Formation annales<br>Quiz infinis</h3>
              <div class="payment-price">170€ TTC</div>
              <ul class="payment-features">
                <li><span style="color: #28a745">✓</span> QCM en mode quiz infinis sur toute la base de données de questions</li>
                <li><span style="color: #28a745">✓</span> Corrections détaillées en autonomie</li>
                <li><span style="color: #28a745">✓</span> Accès pour 31 jours à compter de l'achat</li>
                <li><span style="color: #dc3545">✗</span> Autonomie : pas de questions à l'équipe pédagogique pour cette formule</li>
              </ul>
              <a class="primary-btn" href="https://khypnos-qcm.vercel.app/" target="_blank">Acheter dans l'application</a>
            </article>

            <!-- Complète VE -->
            <article class="payment-card offer-card offer--full">
              <div class="payment-badge">⭐ Recommandé</div>
              <h3>Formation complète<br>Voie Interne</h3>
              <div class="payment-price">880€ TTC</div>
              <ul class="payment-features">
                <li><strong>Formation la plus complète</strong></li>
                <li><span style="color: #28a745">✓</span> Tous les lots de QCMs</li>
                <li><span style="color: #28a745">✓</span> Accès au mode Quiz aléatoire infini</li>
                <li><span style="color: #28a745">✓</span> 2 Concours blancs inclus</li>
                <li><span style="color: #28a745">✓</span> Séances de correction en visioconférence</li>
                <li><span style="color: #28a745">✓</span> Réponse dans les 48 heures à toutes questions à l'équipe pédagogique Khypnos</li>
                <li><span style="color: #28a745">✓</span> Groupe Whatsapp avec les formateurs Khypnos</li>
                <li><span style="color: #28a745">✓</span> Accès immédiat aux vidéos de formation Khypnos : 30h de cours couvrant tout le programme</li>
              </ul>
              <a class="primary-btn" href="https://khypnos-qcm.vercel.app/" target="_blank">Acheter dans l'application</a>
            </article>
          </div>
        </section>
      </div>

          <p style="text-align: center; margin: 20px;">Une question sur la formule à choisir ?</p>

          <div class="back-link" style="margin-top: 30px;">
            <a href="mailto:contact@khypnos.com">Contactez-nous</a>
          </div>

    </div>
  `;
}

function initOffersToggle() {
  const toggle = document.querySelector('.offers-toggle');
  if (!toggle) return;

  const thumb = toggle.querySelector('.offers-toggle__thumb');
  const tabExterne = document.getElementById('offers-tab-externe');
  const tabInterne = document.getElementById('offers-tab-interne');
  const tabs = [tabExterne, tabInterne];

  const panelExterne = document.getElementById('offers-panel-externe');
  const panelInterne = document.getElementById('offers-panel-interne');
  const panels = [panelExterne, panelInterne];

  function measureAndMove(idx) {
    const firstRect = tabs[0].getBoundingClientRect();
    const targetRect = tabs[idx].getBoundingClientRect();
    thumb.style.transform = `translateX(${targetRect.left - firstRect.left}px)`;
    thumb.style.width = `${targetRect.width}px`;
  }

  function activate(idx) {
    tabs.forEach((t, i) => {
      const active = i === idx;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
      t.setAttribute('tabindex', active ? '0' : '-1');
    });

    panels.forEach((p, i) => { if (p) p.hidden = i !== idx; });
    requestAnimationFrame(() => measureAndMove(idx));
  }

  tabExterne.addEventListener('click', () => activate(0));
  tabInterne.addEventListener('click', () => activate(1));

  // init
  activate(0);

  window.addEventListener('resize', () => {
    const idx = tabExterne.classList.contains('is-active') ? 0 : 1;
    requestAnimationFrame(() => measureAndMove(idx));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('khypnos-offers-2026');
  if (!container) return;

  container.innerHTML = renderKhypnosOffers2026();
  initOffersToggle();
});