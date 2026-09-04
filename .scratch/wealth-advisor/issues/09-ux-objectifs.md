# UX de l'écran Objectifs

Type: prototype
Status: resolved
Claimed-by: session_01QHgdqVt4UM28nW12uKohYu

## Question

Suite au ticket [UX du formulaire de profil et du Questionnaire de risque](08-ux-profil-questionnaire-risque.md), les Objectifs (voir [`CONTEXT.md`](../CONTEXT.md)) sortent du formulaire Profil et deviennent leur propre écran, accessible via un bouton de navigation top-level indépendant de "Profil".

Quel écran/flux pour créer, lister et configurer les Objectifs ?

À trancher :
- Structure de l'écran : liste des Objectifs existants + entrée pour en créer un nouveau — quel niveau de détail par défaut (liste compacte vs cartes) ?
- Formulaire de définition d'un Objectif : type (retraite, achat immobilier, transmission, sécurité/urgence, projet libre), libellé, horizon, et montant cible optionnel — comment le montant cible est-il saisi pour un objectif où le chiffrer est non trivial (ex. indépendance financière/FIRE, qui dépend d'hypothèses comme le taux de retrait ou les dépenses annuelles) ? Reste-t-il un simple champ numérique optionnel laissé vide tant que l'utilisateur n'a pas affiné son calcul, ou faut-il un accompagnement (ex. calculette) pour certains types d'Objectif ?
- Édition/suppression d'un Objectif existant.

## Résolution

**Variante B retenue — Cartes + calculette guidée** : grille de cartes, création par mini-assistant en 3 étapes (type → libellé/horizon → montant cible), calculette optionnelle pour les objectifs difficiles à chiffrer. Affinée en session avec l'utilisateur au-delà des 3 variantes initiales :

- **Avancée par Objectif** affichée sur la carte (barre de progression + %, montant atteint) — calculée par rapport à un lien configurable : "Patrimoine total" ou un/plusieurs Domaines (chips modifiables à tout moment, sur la carte via édition rapide ou à la création). La granularité exacte de ce lien et son stockage dans le modèle de données restent à trancher précisément — voir le nouveau ticket [Lien Objectif ↔ patrimoine pour le calcul d'avancée](10-lien-objectif-patrimoine.md).
- **Calculette d'indépendance financière** à deux méthodes sélectionnables : "Règle de retrait (SWR)" (dépenses annuelles visées × multiplicateur) et "Niveau de vie actuel" (dépenses mensuelles actuelles × 12 × multiplicateur). Le choix des méthodes exactes et leurs sources de données sont également à affiner dans ce même nouveau ticket.
- **Carte "Partir de modèles suggérés"** : gabarits d'Objectifs typiques (fonds d'urgence, retraite, achat immobilier, transmission, indépendance financière) sélectionnables par case à cocher, création en lot ; chaque Objectif reste ensuite modifiable individuellement comme les autres.
- **Édition rapide** (horizon, montant cible, lien au patrimoine) directement sur la carte via un bouton crayon, sans écran séparé. Le type et le libellé ne sont pas modifiables depuis cette édition rapide (scope minimal du prototype).

Prototype : [`assets/prototypes/09-ux-objectifs.html`](../assets/prototypes/09-ux-objectifs.html) (3 variantes A/B/C, variante B affinée avec avancée + gabarits + calculette à méthodes).
