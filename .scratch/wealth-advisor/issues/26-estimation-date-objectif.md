# Estimation de date d'atteinte d'un Objectif

Type: grilling
Status: resolved
Claimed-by: session_01KyTR9vL4DycQpCRNm89HNd
Blocked by: 10

## Question

En plus du pourcentage d'avancée déjà acté sur [Lien Objectif ↔ patrimoine pour le calcul d'avancée](10-lien-objectif-patrimoine.md), l'utilisateur veut une **estimation de date d'atteinte** de l'Objectif (en avance/en retard par rapport à son horizon propre), calculée en dur à partir de l'historique de Valorisations du lien patrimoine de l'Objectif — cohérent avec le principe déjà acté que le LLM ne recalcule/n'invente jamais un chiffre ([Conception du moteur de conseil hybride](04-moteur-conseil-hybride.md)).

À trancher : méthode de projection (tendance sur tout l'historique vs sur les derniers points seulement) et cas limites (historique insuffisant, tendance plate/négative).

## Réponse

**Méthode retenue** : tendance calculée sur **tout l'historique de Valorisations disponible** du lien patrimoine de l'Objectif (delta entre la première et la dernière Valorisation du périmètre lié, rapporté à la durée écoulée, projeté linéairement jusqu'au montant cible) — plutôt qu'une tendance sur les 2 derniers points seulement. Motivation : le rythme de mise à jour est semestriel et irrégulier ("aléatoire"), donc 2 points seuls seraient trop bruités pour une projection fiable ; l'historique complet lisse ce bruit.

**Cas limites** :
- **Moins de 2 points d'historique** sur le périmètre lié → pas de date de projection affichée (donnée insuffisante), seul le % d'avancée courant reste montré.
- **Tendance plate ou négative** (le patrimoine lié ne progresse pas ou régresse) → pas de date absurde affichée ; message qualitatif du type « non atteignable au rythme actuel » plutôt qu'un chiffre.

**Affichage** : la date estimée est comparée à l'horizon propre de l'Objectif pour exprimer une avance/un retard (ex. « estimé atteint en mars 2029, soit 8 mois avant ton horizon » / « en retard de 2 ans sur ton horizon »).

Décidé par grilling avec l'utilisateur.
