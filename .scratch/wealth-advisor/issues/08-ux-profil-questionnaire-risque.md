# UX du formulaire de profil et du Questionnaire de risque

Type: prototype
Status: resolved
Claimed-by: session_01QHgdqVt4UM28nW12uKohYu

## Question

Sur la base du modèle de profil (voir [Modèle de profil utilisateur & méthodologie de profil de risque](02-profil-risque.md) et [`CONTEXT.md`](../CONTEXT.md)), quels écrans afficher pour saisir/mettre à jour le Profil (champs factuels : date de naissance, TMI, situation familiale, Objectifs) et faire passer le Questionnaire de risque ?

À trancher :
- Formulaire unique vs assistant multi-étapes (ex. un écran par bloc : identité/fiscalité, situation familiale, Objectifs, Questionnaire de risque).
- Où et quand ce formulaire apparaît-il — onboarding initial obligatoire avant tout usage, ou accessible à tout moment depuis un écran "Profil" ?
- Écran de saisie des Objectifs : liste éditable avec ajout/suppression, formulaire par Objectif (type, libellé, horizon, montant cible optionnel).
- Présentation du Questionnaire de risque (4 questions) et de son résultat (bucket + connaissance des marchés), et endroit où l'utilisateur peut voir/déclencher l'override manuel via chat mentionné dans la réponse du ticket [Modèle de profil utilisateur & méthodologie de profil de risque](02-profil-risque.md).

## Answer

Prototype (3 variantes) : [`assets/prototypes/08-ux-profil-questionnaire-risque.html`](../assets/prototypes/08-ux-profil-questionnaire-risque.html). La **variante A — Formulaire unique** (page unique avec navigation ancrée sticky vers les sections Identité & fiscalité / Situation familiale / Questionnaire de risque) est retenue. Les variantes B (assistant multi-étapes obligatoire à l'onboarding) et C (tableau de bord en cartes séparées) sont écartées comme structure d'écran, mais l'idée de C d'isoler le Questionnaire de risque dans un flux à part est reprise (voir décisions ci-dessous).

Décisions :
- **Écran Profil = variante A**, un formulaire unique déroulant avec sections ancrées (Identité & fiscalité, Situation familiale, Questionnaire de risque).
- **Pas d'onboarding obligatoire** : l'écran Profil est accessible à tout moment depuis un item "Profil" de la navigation, jamais forcé au premier lancement — l'utilisateur peut commencer à saisir son patrimoine avant même d'avoir rempli son Profil.
- **Les Objectifs sortent entièrement du formulaire Profil** : ils deviennent leur propre écran, accessible via un bouton de navigation top-level distinct de "Profil" (au même niveau, pas une sous-section). L'écran Profil ne fait **aucune référence** aux Objectifs (pas de résumé, pas de lien) — les deux écrans sont indépendants. Raison : bien définir un Objectif (ex. un objectif d'indépendance financière/FIRE) demande plus d'espace que ce qu'un formulaire rapide inline permet, notamment pour le montant cible qui peut nécessiter des hypothèses (taux de retrait, dépenses...) qu'on ne veut pas bâcler dans un champ de saisie éclair. Le détail de cet écran (comment on définit un Objectif, y compris un objectif type FIRE) est cadré dans un nouveau ticket, [UX de l'écran Objectifs](09-ux-objectifs.md).
- **Carte Questionnaire de risque** : affiche le résultat calculé (bucket prudent/équilibré/dynamique + niveau de connaissance des marchés), avec un **bouton explicite "Ajuster en chat"** qui amène l'utilisateur vers la conversation pour faire l'override manuel du bucket (mécanisme déjà décidé au ticket [Modèle de profil utilisateur & méthodologie de profil de risque](02-profil-risque.md)) — pas seulement une note textuelle, pour que le point d'entrée soit découvrable directement depuis l'écran où le résultat est affiché.

Décidé par prototype (3 variantes, artifact) + réaction et grilling de l'utilisateur.
