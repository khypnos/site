(function() {
  // Scope: .faq-wrapper (page FAQ dédiée) OU #faq (accueil)
  const containers = document.querySelectorAll('.faq-wrapper, #faq');
  if (containers.length === 0) return;

  containers.forEach(container => {
    const items = container.querySelectorAll('.faq-item');

    items.forEach(item => {
      const btn = item.querySelector('.faq-question');
      if (!btn) return;

      btn.addEventListener('click', () => {
        const answer = item.querySelector('.faq-answer');
        const isOpen = item.classList.contains('open');

        // Ferme les autres items du même container
        items.forEach(other => {
          if (other !== item && other.classList.contains('open')) {
            other.classList.remove('open');
            other.querySelector('.faq-answer').style.maxHeight = '0';
            other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle l'item courant
        if (isOpen) {
          item.classList.remove('open');
          answer.style.maxHeight = '0';
          btn.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('open');
          answer.style.maxHeight = answer.scrollHeight + 'px';
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  });
})();