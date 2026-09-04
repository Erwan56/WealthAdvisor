# Prototype de la calculette d'indépendance financière (FIRE)

Type: prototype
Status: resolved
Claimed-by: session_01QHgdqVt4UM28nW12uKohYu
Blocked by: 11

## Question

Suite au ticket de recherche [Recherche : méthodologie de calcul de l'indépendance financière (FIRE)](11-recherche-methodologie-fire.md), concevoir l'UI de la calculette FIRE de l'écran Objectifs (voir [`assets/prototypes/09-ux-objectifs.html`](../assets/prototypes/09-ux-objectifs.html)) : quels champs de saisie (dépenses, taux de retrait...), quelles méthodes proposées et comment basculer entre elles, comment le taux de retrait par défaut est présenté et ajustable, et comment le résultat est reversé dans le montant cible de l'Objectif.

**Cadrage déjà tranché (à ne pas rouvrir)** : rester simple plutôt qu'exact — le montant cible calculé par la calculette est un **objectif brut** (fiscalité non prise en compte, cf. §4 de la recherche), comparé à un patrimoine **net** (cf. [Lien Objectif ↔ patrimoine pour le calcul d'avancée](10-lien-objectif-patrimoine.md)). Pas de paramètre de "ponction fiscale effective" (option 2 de la recherche) — cette option est écartée.

## Réponse

Trois variantes explorées et publiées dans [`assets/prototypes/12-prototype-calculette-fire.html`](../assets/prototypes/12-prototype-calculette-fire.html) (onglets+menu, slider continu, comparaison de 3 scénarios en cartes). **Décision : variante la plus simple retenue**, encore simplifiée en session avec l'utilisateur — repli sur un seul scénario, pas de comparaison.

- **Deux méthodes de saisie gardées**, en toggle : "Règle de retrait (SWR)" (dépenses annuelles *visées* à la retraite — un budget projeté) et "Niveau de vie actuel" (dépenses mensuelles *actuelles* × 12 — le train de vie présent comme proxy). Les deux répondent à un besoin différent (projection vs donnée immédiatement disponible), même si la formule derrière est identique.
- **Multiplicateur fixé à 25× (retrait 4 %, règle des 4 %/Trinity-Bengen), non ajustable** — pas de sélecteur ni de slider. Un seul résultat affiché, pas de comparaison de scénarios (Modéré 28,6× / Prudent 33× écartés de l'UI — trop de choix pour peu de valeur ajoutée ici).
- **Avertissement "objectif brut"** affiché en note visible sous le résultat (pas caché derrière une info-bulle au survol) : "Objectif brut — ne tient pas compte de la fiscalité au retrait."
- Design final foldé directement dans le prototype de référence de l'écran Objectifs : [`assets/prototypes/09-ux-objectifs.html`](../assets/prototypes/09-ux-objectifs.html) (Variante B, étape 3 du mini-assistant — `FIRE_MULT` constant, plus de sélecteur de multiplicateur).
