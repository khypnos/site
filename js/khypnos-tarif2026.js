function renderKhypnosOffers2026() {
  return `
    <h2 class="section-title">Formations 2026</h2>
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
        <li><span class="emoji">💳</span>Possibilité de paiement en plusieurs échéances : nous contacter</li>
      </ul>
    </div>

    <h2 class="section-title">Tarifs 2026</h2>
    <section class="offers">
      <div class="payment-options">
        <!-- Carte Concours blanc seul -->
        <article class="payment-card featured">
          <div class="payment-badge">Populaire</div>
          <h3>Concours blanc <br> seul</h3>
          <div class="payment-price">120€ TTC</div>
          <ul class="payment-features">
            <li><span style="color: #28a745">✓</span> Au choix :</li>
            <li>• <strong>Format QCM</strong> (voie interne, 50 QCMs)</li>
            <li>• <strong>Format rédactionnel</strong> (voie externe, EVCF 20 questions, EVCP 20 questions environ)</li>
            <li><span style="color: #28a745">✓</span> Correction en session interactive</li>
            <li><span style="color: #28a745">✓</span> Conseils méthodologiques</li>
          </ul>
          <a class="primary-btn" href="/medecin/demande_concours.html">S’inscrire</a>
        </article>

        <!-- Carte Formation annales Voie Externe -->
        <article class="payment-card featured">
          <h3>Formation annales <br> Voie Externe</h3>
          <div class="payment-price">1300€ TTC</div>
          <ul class="payment-features">
            <li><span style="color: #28a745">✓</span> Sessions de correction d'annales en direct</li>
            <li><span style="color: #28a745">✓</span> Session "nouvelles recommandations"</li>
            <li><span style="color: #dc3545">✗</span> Pas d'accès aux cours Khypnos</li>
            <li><span style="color: #dc3545">✗</span> Pas d'accès aux concours blanc</li>
            <li><span style="color: #dab61a">✓</span> Accès aux formateurs Khypnos pendant les sessions de correction</li>
          </ul>
          <a class="primary-btn" href="#inscription">S’inscrire</a>
        </article>

        <!-- Carte Formation complète Voie Externe -->
        <article class="payment-card offer-card offer--full">
          <div class="payment-badge">⭐ Recommandé</div>
          <h3>Formation complète <br> Voie Externe</h3>
          <div class="payment-price">1800€ TTC</div>
          <ul class="payment-features">
            <li><strong>Formation la plus complète</strong></li>
            <li><span style="color: #28a745">✓</span> Sessions de correction d'annales en direct</li>
            <li><span style="color: #28a745">✓</span> Correction de copie et conseils méthodologiques</li>
            <li><span style="color: #28a745">✓</span> Accès aux vidéos de formation Khypnos : 60h de cours remis à jours</li>
            <li><span style="color: #28a745">✓</span> Session "nouvelles recommandations"</li>
            <li><span style="color: #28a745">✓</span> 2 concours blancs au format des EVC</li>
            <li><span style="color: #28a745">✓</span> Accès aux formateurs Khypnos priorisé pour toutes questions</li>
            <li><span style="color: #28a745">✓</span> 10 places ouvertes</li>
          </ul>
          <a class="primary-btn" href="#inscription">S’inscrire</a>
        </article>

        <!-- Carte Formation Voie Interne -->
        <article class="payment-card offer-card offer--full">
          <h3>Formation <br> Voie Interne</h3>
          <div class="payment-price">Prix selon formation</div>
          <ul class="payment-features">
            <li><strong>Les offres sont détaillées directement dans l'application Khypnos QCMs</strong></li>
          </ul>
          <a class="secondary-btn" href="https://khypnos-qcm.vercel.app/" target="_blank">
            Accès Khypnos QCMs
          </a>
        </article>
      </div>
    </section>
  `;
}
