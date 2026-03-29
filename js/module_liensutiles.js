function renderLiensUtiles() {
  return `

<h2 class="section-title">🚀 Liens utiles</h2>

<div class="links-section" data-reveal="right" data-stagger data-stagger-target=":scope > .column > .feature-list > li" data-stagger-step="50">
					<div class="column">
						<ul class="feature-list">
							<li><span class="emoji">✅</span><a href="/medecin/la_prepa_khypnos.html" class="souschap" rel="noopener noreferrer"><strong>La prépa Khypnos</strong></a></li>
							<li><span class="emoji">🩺</span><a href="/medecin/guide_evc.html" class="souschap" rel="noopener noreferrer"><strong>Guide de réussite Khypnos</strong></a></li>
              <li><span class="emoji">📔</span><a href="/medecin/demande_programme.html" class="souschap" rel="noopener noreferrer"><strong>Recevoir le programme</strong></a></li>
							<li><span class="emoji">📃</span><a href="/medecin/demande_inscription.html" class="souschap" rel="noopener noreferrer"><strong>Formulaire d'inscription</strong></a></li>
								<div class="back-link">
								<a href="/medecin/annales/achat_corrections.html">Acheter les corrigés d'annales</a>
								</div>
						</ul>

					</div>

				</div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('LiensUtiles');
  if (container) {
    container.innerHTML = renderLiensUtiles();
  }
});