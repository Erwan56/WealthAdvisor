# Reporting et visualisation de l'évolution du patrimoine

Type: prototype
Status: resolved
Claimed-by: session_01QHgdqVt4UM28nW12uKohYu

## Question

Sur la base du modèle historisé (Valorisations datées par Ligne, voir [Modèle de données du patrimoine par domaine](01-modele-patrimoine.md) et [`CONTEXT.md`](../CONTEXT.md)), quelles vues consolidées afficher pour visualiser le patrimoine et son évolution dans le temps ?

À trancher :
- Vue consolidée courante : patrimoine total, répartition par domaine/enveloppe, patrimoine net (déduction des dettes, ex. capital restant dû immobilier).
- Vue temporelle : courbe d'évolution du patrimoine total et par domaine, granularité (par mise à jour, mensuelle...).
- Niveau de détail par domaine dans ces vues (ex. immobilier : cash-flow/rendement locatif affiché où et comment).

## Answer

Prototype (3 variantes) : [`assets/prototypes/07-reporting-visualisation.html`](../assets/prototypes/07-reporting-visualisation.html). La variante **A — Synthèse chiffrée** (KPI + donut + tableau par domaine) est retenue comme structure de base de l'écran de reporting global. Les variantes B (courbe temporelle en héros) et C (grille de fiches par domaine) sont écartées comme écrans autonomes, mais le panneau de détail au clic de la variante C est repris à l'intérieur de la variante A.

Décisions :
- **Écran principal = variante A** : deux KPI cards (Patrimoine total, Patrimoine net) toujours visibles côte à côte, donut de répartition par domaine, tableau des domaines avec valeur, part, variation, aperçu (sparkline) et indicateur clé (ex. rendement locatif net, plus-value latente, ancienneté fiscale...).
- **Patrimoine net** : toujours affiché à côté du patrimoine brut (deux KPI cards en permanence), pas un toggle ni une info reléguée au seul détail immobilier.
- **Granularité temporelle** : **par mise à jour uniquement** — pas de rééchantillonnage mensuel/annuel proposé à l'utilisateur ; chaque courbe (sparkline de ligne comme courbe du panneau de détail) reflète fidèlement le modèle historisé (une Valorisation = un point). Le sélecteur de granularité de la variante B est écarté.
- **Détail par domaine** : cliquer une ligne du tableau ouvre un panneau de détail par domaine (repris de la variante C), qui montre : la courbe complète du domaine (par mise à jour), l'indicateur clé du domaine, **et la liste des Enveloppes/Lignes de ce domaine avec, pour chacune, sa valeur actuelle et sa propre variation (delta) depuis la dernière mise à jour** — pas seulement un delta agrégé au niveau du domaine.

Décidé par prototype (3 variantes, artifact) + réaction et grilling de l'utilisateur.
