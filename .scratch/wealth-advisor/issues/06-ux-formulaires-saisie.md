# UX des formulaires de saisie par domaine

Type: prototype
Status: resolved
Claimed-by: session_01QHgdqVt4UM28nW12uKohYu

## Question

Sur la base du modèle de données du patrimoine (voir [Modèle de données du patrimoine par domaine](01-modele-patrimoine.md) et [`CONTEXT.md`](../CONTEXT.md)), quels écrans et champs afficher lors de la création/mise à jour d'une Ligne et, le cas échéant, d'une Enveloppe, pour chaque domaine ?

À trancher :
- Formulaire unique par domaine vs assistant multi-étapes (ex. création d'une Enveloppe puis ajout de Lignes).
- Comment saisir un Mouvement (versement, achat...) vs une Valorisation — écrans séparés ou un seul écran de mise à jour qui déduit le type d'action ?
- Valeurs par défaut, validations, et ergonomie spécifique par domaine (ex. immobilier avec ses paramètres courants nombreux).

## Answer

Prototype (3 variantes) : [`assets/prototypes/06-ux-formulaires-saisie.html`](../assets/prototypes/06-ux-formulaires-saisie.html). La variante **C — Tableau de bord** (rail de domaines + liste par Enveloppe/Ligne, édition en ligne par expansion) est retenue comme structure de base de l'écran de saisie. Les variantes A (formulaire unique) et B (assistant pas à pas) sont écartées comme écrans autonomes mais A est réutilisée pour la création (voir ci-dessous).

Décisions :
- **Écran principal = variante C** : par domaine, une liste des Enveloppes (le cas échéant) et de leurs Lignes ; cliquer une Ligne l'étend en ligne pour éditer sa Valorisation courante.
- **Mouvement vs Valorisation : un seul écran, déduit** — l'édition d'une Ligne montre par défaut les champs de Valorisation ; un disclosure repliable « Associer un mouvement (versement, achat...) » s'ouvre si la mise à jour correspond aussi à une opération datée. Pas d'écrans séparés. Ce principe s'applique aussi bien à l'édition en ligne (C) qu'à la création (voir ci-dessous).
- **Création (« + Ajouter »)** : ouvre un formulaire style **variante A** (formulaire unique par domaine) en **panneau/modale par-dessus le dashboard** — le dashboard reste en arrière-plan, la fermeture du panneau revient à la liste mise à jour (pas de navigation plein écran séparée).
- **Portée de la création** : deux points d'entrée — un « + Ajouter » au niveau du dashboard crée une nouvelle Enveloppe (+ sa première Ligne) pour les domaines qui en ont une, ou une nouvelle Ligne autonome pour liquidités/immobilier ; un « + » local au sein du groupe d'une Enveloppe existante ajoute directement une nouvelle Ligne dans cette Enveloppe sans repasser par les champs d'Enveloppe.
- **Ergonomie par domaine** (ex. immobilier et ses nombreux paramètres courants) : reste portée par le même mécanisme générique champ-par-champ que dans le prototype (voir `DOMAINS` dans le prototype) — pas de traitement spécial supplémentaire nécessaire au-delà de ce que montre le prototype.

Décidé par prototype (3 variantes, artifact) + réaction de l'utilisateur. Le tableau de bord global visuel (camembert, vue consolidée) évoqué en réaction est **hors du périmètre de ce ticket** — couvert par [Reporting et visualisation de l'évolution du patrimoine](07-reporting-visualisation.md).

## Amendement (voir [Logique de conseil et anomalies — Immobilier](16-conseil-immobilier.md))

Pour les Lignes immobilier, afficher le rendement brut, le rendement net de charges et le cash-flow (champs dérivés à l'affichage à partir des paramètres courants déjà saisis — pas de nouveau champ stocké) directement sur la Ligne dans le tableau de bord, en plus de leur usage dans le conseil en chat.

## Amendement à venir — historisation des Valorisations

Gap identifié : ce ticket ne traite pas de date de Valorisation explicite/éditable ni de vue d'historique par Ligne — l'usage réel de l'utilisateur (mises à jour semestrielles à dates arbitraires, pas temps réel) l'exige. Reporté à un nouveau ticket de prototype dédié : [Prototype de l'historisation des Valorisations](27-prototype-historisation-valorisations.md).
