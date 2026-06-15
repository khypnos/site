/* ─────────────────────────────────────────────
   /js/annale.js
   Renderer générique pour pages d'annale (EVC)

   La numérotation des questions est globale, 
   mais réinitialisée à chaque "Cas Clinique" dans Title de section.
   ───────────────────────────────────────────── */

(function () {
    'use strict';

    const data = window.ANNALE;
    const root = document.getElementById('annale-root');
    if (!data || !root) {
        console.warn('[annale.js] window.ANNALE ou #annale-root manquant');
        return;
    }

    const make = (tag, opts = {}) => {
        const node = document.createElement(tag);
        if (opts.className) node.className = opts.className;
        if (opts.text != null) node.textContent = opts.text;
        if (opts.html != null) node.innerHTML = opts.html;
        return node;
    };

    // Une section démarre un nouveau cas clinique si son titre contient "cas clinique"
    const isNewClinicalCase = (title) =>
        typeof title === 'string' && /cas\s+clinique/i.test(title);

    // ── Titre principal ──
    if (data.title) {
        root.appendChild(make('h2', {
            className: 'section-title page-title',
            text: data.title
        }));
    }

    // Compteur global de questions (reset sur "Cas Clinique")
    let questionCounter = 0;

    (data.sections || []).forEach(section => {

        // Reset du compteur si nouveau cas clinique
        if (isNewClinicalCase(section.title)) {
            questionCounter = 0;
        }

        // Bloc énoncé / intro
        if (section.title || section.body) {
            const subj = make('div', { className: 'subject-section' });
            if (section.title) {
                subj.appendChild(make('h3', { className: 'subject-title', text: section.title }));
            }
            if (section.body) {
                subj.appendChild(make('div', { className: 'subject-text', html: section.body }));
            }
            root.appendChild(subj);
        }

        // Questions
        if (Array.isArray(section.questions) && section.questions.length > 0) {
            section.questions.forEach(q => {
                questionCounter++;
                const num = questionCounter;

                const qBlock = make('div', { className: 'question-section' });
                qBlock.appendChild(make('h3', {
                    className: 'question-title',
                    text: `Question ${num}`
                }));

                const qBody = make('div', { className: 'question-text' });

                if (q.image && q.image.src) {
                    const fig = make('div', { className: 'image-container' });
                    const img = document.createElement('img');
                    img.src = q.image.src;
                    img.alt = q.image.alt || `Illustration de la question ${num}`;
                    img.className = 'question-image';
                    img.loading = 'lazy';
                    fig.appendChild(img);
                    qBody.appendChild(fig);
                }

                if (q.text) {
                    qBody.appendChild(make('div', { html: q.text }));
                }

                qBlock.appendChild(qBody);
                root.appendChild(qBlock);
            });
        }
    });

    // ── CTA partagé ──
    const ctaSlot = document.querySelector('[data-annale-cta]');
    if (ctaSlot) {
        const cta = make('div', {
            className: 'cta-section',
            html: `
                <h3>🚀 Rejoignez notre formation complète</h3>
                <p>Cette annale fait partie de notre programme. Découvrez notre préparation intensive avec corrections détaillées pour maximiser vos chances de réussite aux EVC.</p>
                <a href="/index.html" class="cta-button">Découvrir la formation Khypnos</a>`
        });
        ctaSlot.replaceWith(cta);
    }
})();