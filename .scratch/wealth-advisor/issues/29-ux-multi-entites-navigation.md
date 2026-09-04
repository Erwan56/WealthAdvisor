# UX multi-Entités — création et navigation

Type: prototype
Status: resolved
Claimed-by: session_01KyTR9vL4DycQpCRNm89HNd
Blocked by: 01, 06, 07, 28 (closed — unblocked)

## Question

Suite au ticket [Modélisation multi-entités juridiques / sociétés](28-modelisation-multi-entites-juridiques.md), le patrimoine se répartit désormais entre plusieurs Entités (`perso` implicite + `pro_1`/`sci_1`... créées à la demande). Deux flux à prototyper :

- **Création d'une Entité** : mini-formulaire (libellé + type) accessible à tout moment sans onboarding obligatoire — sur le modèle déjà acté au ticket [UX du formulaire de profil et du Questionnaire de risque](08-ux-profil-questionnaire-risque.md) ("accessible à tout moment depuis Profil") et au mini-assistant du ticket [UX de l'écran Objectifs](09-ux-objectifs.md).
- **Navigation existante à rescoper** : le dashboard (rail Domaines + liste Enveloppe/Ligne, voir [UX des formulaires de saisie par domaine](06-ux-formulaires-saisie.md)) et l'écran de reporting (KPI total/net + donut + tableau par domaine, voir [Reporting et visualisation de l'évolution du patrimoine](07-reporting-visualisation.md)) reflètent aujourd'hui un patrimoine personnel unique. Comment un sélecteur d'Entité s'articule-t-il avec le rail Domaines existant (onglet parallèle, filtre au-dessus du rail...) — sachant que la vision consolidée reste agrégée toutes Entités par défaut, avec détail par Entité au clic (déjà acté au ticket 28) ?

## Réponse

**Variante retenue : A — onglets d'Entité au-dessus du rail Domaines.** Les Entités deviennent un niveau de navigation à part entière, sur le modèle des onglets Domaines déjà en place — pas de dropdown façon "espace de travail" (variante B) ni de rail imbriqué Entité > Domaine (variante C). Même rangée d'onglets réutilisée à l'identique sur le Dashboard et le Reporting : Entités nommément (badge coloré par type + libellé) puis `+ Nouvelle Entité` en dernier.

**"Toutes les Entités" est un onglet à part entière, disponible aussi bien sur le Dashboard que sur le Reporting** (pas seulement le Reporting comme dans le premier jet) :
- Sur le **Reporting**, comportement inchangé : KPI + tableau de répartition par Domaine agrégés toutes Entités.
- Sur le **Dashboard**, cliquer un Domaine du rail pendant que "Toutes les Entités" est actif affiche la liste **fusionnée** des Lignes de ce Domaine à travers toutes les Entités qui le portent, avec une **colonne Entité** (badge + libellé) par ligne — pas de regroupement par Entité, une liste plate. Le bouton "+ Ajouter" est remplacé par une invite à choisir une Entité précise, puisque créer une Ligne reste une action intra-Entité (cohérent avec le ticket [Modélisation multi-entités juridiques / sociétés](28-modelisation-multi-entites-juridiques.md)).

**Carte KPI "Entités" (nombre d'Entités)** : affichée uniquement en vue consolidée ("Toutes les Entités") sur le Reporting — masquée dès qu'une Entité précise est sélectionnée, où elle est redondante.

**Création d'une Entité** : mini-formulaire (libellé + type) ouvert depuis `+ Nouvelle Entité` en fin de rangée d'onglets, accessible à tout moment sans onboarding — même logique que le ticket [UX du formulaire de profil et du Questionnaire de risque](08-ux-profil-questionnaire-risque.md). Le champ Type ne propose que `Activité de service` / `Détention immobilière` — pas `Personnelle`, `perso` étant unique et déjà implicite (voir ticket 28).

**Amendement posé sur les tickets [UX des formulaires de saisie par domaine](06-ux-formulaires-saisie.md) et [Reporting et visualisation de l'évolution du patrimoine](07-reporting-visualisation.md)** : les deux écrans gagnent la rangée d'onglets d'Entité décrite ci-dessus au-dessus de leur en-tête existant ; leur contenu (rail Domaines, ledger, KPI, donut, tableau) reste par ailleurs inchangé et continue de s'appliquer à l'Entité (ou à "Toutes les Entités") sélectionnée.

Prototype (3 variantes explorées, A retenue après itération sur retours utilisateur) dans [`assets/prototypes/29-ux-multi-entites-navigation.html`](../assets/prototypes/29-ux-multi-entites-navigation.html).

Décidé par prototype réagi en session avec l'utilisateur (`/prototype`).
