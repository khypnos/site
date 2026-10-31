# Espace client Quiz — branche Devnotion_site

## Périmètre

Changement du dashboard du site uniquement. Branche `Devnotion_site` créée depuis main `ee1157f3f6fa9f495e806e5e8a76b11249116fd3`. Aucune modification de main et aucun merge automatique : la fusion appartient à Baptiste.

Fichiers fonctionnels : `espace-client/index.html` et nouveau module `espace-client/qcm-access.js`. Les styles existants sont réutilisés sans refonte. Auth, login et endpoints de ressources de formation ne sont pas modifiés.

Aucune migration SQL, écriture de données, nouvelle RPC, nouvelle API Vercel ou fonction Edge à déployer. L'Edge Function `get-dashboard` reste inchangée.

## Fonctionnement

- L'entrée dans le dashboard reste soumise à la session et à l'autorisation de `get-dashboard` (notamment student actif).
- Les marqueurs `quiz_med` et `quiz_rfe` sont affichés « Quiz fondamental » et « Quiz RFE » ; les autres libellés restent inchangés.
- Deux SELECT authentifiés sur les tables existantes, filtrés par UID et protégés par les politiques RLS existantes, lisent les achats Quiz/RFE et le profil.
- La carte Accès QCM affiche chaque produit, l'échéance en heure de Paris et les jours restants ; les achats expirés proposent Renouveler. Un produit désactivé est distinct d'un produit expiré.
- Un abonnement complet valide évite une invitation inutile à renouveler un ancien quiz expiré. Un achat permanent reste indiqué comme permanent.
- Ces calculs servent à l'affichage : ils ne donnent pas de droits QCM, n'ajoutent aucun module et ne remplacent pas le contrôle serveur des achats.
- Vidéo, annales et corrections restent affichées uniquement selon la réponse actuelle de get-dashboard. Un Quiz seul ne fabrique aucune de ces autorisations.
- Après expiration, le portail reste accessible si student est toujours actif. Aucune désactivation automatique de student n'est ajoutée.

## Transfert vers l'app

Le clic « Ouvrir l'application QCM » ou « Renouveler » relit la session Supabase fraîche et utilise le receive-session existant. Les tokens sont dans le fragment de l'URL de destination, pas dans sa query ni dans les liens du DOM. Aucun mot de passe ni nouvelle connexion n'est créé par ce transfert ; si la session n'existe plus, retour au login.

Renouveler ouvre le menu QCM pour choisir une formule : pas de paiement automatique, pas de paramètre nouveau à gérer par une ancienne application.

**Le destinataire est volontairement fixe : https://khypnos-qcm.vercel.app/receive-session.** Une preview du site ouvre donc l'application de production après transfert. Pour une recette intégrée site/app preview, adapter cette constante dans la branche de recette à l'origine précise approuvée, pas à une URL arbitraire reçue en paramètre. Ne pas utiliser de vraies cartes pour la recette.

La version QCM DevNotion `806d07c` prépare le webhook qui ajoute les marqueurs étudiants lors des prochains achats et le filtre des achats expirés dans la modale. Tant que cette version n'est pas publiée dans l'app, un ancien achat encore marqué actif peut y bloquer un renouvellement. Le site ne contourne pas cette règle de l'app.

## Actualisation et pannes

Relecture au chargement puis chaque minute tant que la page est visible et en ligne, et au retour sur l'onglet/réseau (avec limitation à une fois par minute). Fetch dashboard sans cache ; délais maximum pour fetch et lectures quand le navigateur/SDK les supporte.

Une panne de lecture des échéances conserve la carte QCM et affiche une indisponibilité, sans inventer de date. Une panne temporaire du dashboard propose Réessayer, sans expulser automatiquement. Les réponses 401/403 de get-dashboard continuent de ramener vers le login. Les champs texte injectés dans le dashboard sont échappés.

## Dépendances et non-actions

Le rattrapage des anciens acheteurs dans students n'est pas exécuté ici. Un client sans student actif reste soumis au contrôle actuel du portail : préparer d'abord l'inventaire et le rattrapage séparés. Ne pas rejouer d'anciens paiements Stripe pour ce rattrapage.

Aucun accès Quiz par famille, aucun nettoyage d'achat, aucun durcissement de privilège Supabase dans ce lot.

## Recette avant merge

1. Preview de Devnotion_site : student actif avec quiz_med seul ; seul Accès QCM et son échéance, pas de vidéo/annales/correction.
2. Quiz RFE seul puis les deux produits avec deux échéances différentes.
3. Produit expiré : accès au dashboard conservé, Accès expiré et Renouveler ; passage connecté vers l'app, pas de paiement automatique.
4. Formation existante : cartes vidéo/annales/corrections autorisées inchangées.
5. Produit permanent ou désactivé, abonnement complet actif, ancienne catégorie NULL.
6. Déconnexion, panne réseau, lecture d'échéances indisponible puis Réessayer.
7. Vérifier les affichages sur mobile et les libellés sans underscores.
8. Merger manuellement après validation. Aucun déploiement Supabase n'est requis.

## Tests locaux

```sh
node --test tests/quiz-portal-status.test.mjs
KHYPNOS_CHROMIUM=/chemin/chromium node --test tests/quiz-client-portal.browser.test.mjs tests/quiz-dashboard.browser.test.mjs
```

Les tests navigateur nécessitent Playwright en environnement QA ; le module n'est pas ajouté aux dépendances du site. Le test complet peut recevoir `KHYPNOS_DASHBOARD_CSS=/chemin/css/dashboard.css` pour utiliser la feuille de style existante. Les tests ont été exécutés avec cette feuille et Chromium isolé.

Auth, get-dashboard et SELECT sont simulés avec des identités fictives. Aucun test ne se connecte à un vrai compte ou à Stripe. Les vérifications locales ne remplacent pas la recette de preview avec le schéma et les RLS réels. Les scripts existants d'en-tête/pied de page ne sont pas refondus dans cette livraison.
