# Lien Objectif ↔ patrimoine pour le calcul d'avancée

Type: grilling
Status: resolved
Claimed-by: session_01QHgdqVt4UM28nW12uKohYu

## Question

Suite au ticket [UX de l'écran Objectifs](09-ux-objectifs.md), la variante retenue affiche une avancée (barre de progression) par Objectif, calculée par rapport à un lien configurable — "Patrimoine total" ou un/plusieurs Domaines. Le prototype illustre cette interaction mais ne tranche pas le mécanisme sous-jacent.

À trancher :
- **Granularité du lien** : Domaine(s) entiers (ex. "Bourse", "Immobilier") vs Enveloppes/Lignes individuelles vs patrimoine net total uniquement ? Le prototype explore un lien au niveau Domaine(s) ou "Patrimoine total" — à valider ou remettre en cause. L'utilisateur a exprimé le besoin d'être "assez fin... au niveau domaine... et au niveau total".
- **Double-compte** : un même Domaine/actif peut-il compter pour l'avancée de plusieurs Objectifs à la fois, ou le patrimoine doit-il être "alloué" une seule fois entre Objectifs ?
- **Stockage** : ce lien fait-il partie du concept Objectif dans le modèle de données (voir [`CONTEXT.md`](../CONTEXT.md), ticket [Modèle de données du patrimoine par domaine](01-modele-patrimoine.md)), ou est-ce une donnée calculée/dérivée à la volée sans persistance ?
- **Méthodes de calcul pour les Objectifs difficiles à chiffrer** (type Projet libre, ex. indépendance financière/FIRE) : l'utilisateur souhaite plusieurs méthodes (ex. règle de retrait à 4 %/25×, ou évaluation basée sur le niveau de vie actuel). Quelles méthodes exactement, avec quelles formules, et quelles sources de données (dépenses saisies manuellement dans le formulaire, ou dérivées des Mouvements de patrimoine) ?

## Résolution

- **Granularité** : lien configurable par Objectif à un ou plusieurs Domaines entiers et/ou à "Patrimoine total" — pas de niveau Enveloppe/Ligne individuel (non exprimé comme besoin).
- **Valeur** : calcul sur le **Patrimoine net** (valeur diminuée des dettes), cohérent avec le KPI net du dashboard de reporting (ticket [Reporting et visualisation de l'évolution du patrimoine](07-reporting-visualisation.md)).
- **Double-compte** : autorisé librement entre Objectifs, sans avertissement ni mécanisme d'allocation — chaque Objectif calcule son avancée indépendamment sur son propre lien.
- **Stockage** : le lien est un champ persistant sur l'Objectif (`lien_patrimoine` = `Total` ou liste de Domaines), modifiable à tout moment (création ou édition rapide). Terminologie consignée dans [`CONTEXT.md`](../CONTEXT.md).
- **Pas de valeur par défaut** : un nouvel Objectif reste sans lien configuré (pas d'avancée affichée) tant qu'il n'est pas réglé explicitement par l'utilisateur.
- **Méthodes de calcul de la calculette FIRE** (taux de retrait, sources de données) : reportées à un ticket de recherche dédié, suivi d'un ticket de prototype UI — voir [Recherche : méthodologie de calcul de l'indépendance financière (FIRE)](11-recherche-methodologie-fire.md) et [Prototype de la calculette d'indépendance financière (FIRE)](12-prototype-calculette-fire.md).

## Amendement (voir [Estimation de date d'atteinte d'un Objectif](26-estimation-date-objectif.md))

En plus du % d'avancée, chaque Objectif affiche une estimation de date d'atteinte (avance/retard vs son horizon propre), calculée en dur par tendance sur tout l'historique de Valorisations disponible du lien patrimoine — détail de la méthode et des cas limites dans le ticket lié.

## Amendement (voir [Modélisation multi-entités juridiques / sociétés](28-modelisation-multi-entites-juridiques.md))

`lien_patrimoine` peut désormais aussi cibler une **Entité** (ex. un Objectif "transmission" lié à la SCI), en plus de Domaine(s) et Patrimoine net total — même principe déjà acté (pas de valeur par défaut, double-compte autorisé).
