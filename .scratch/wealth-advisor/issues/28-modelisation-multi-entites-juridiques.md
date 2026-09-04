# Modélisation multi-entités juridiques / sociétés

Type: grilling
Status: resolved
Claimed-by: session_01KyTR9vL4DycQpCRNm89HNd

## Question

Faut-il modéliser séparément les structures juridiques de l'utilisateur (SARL — activité IT indépendante, SCI — détention immobilière, révélées lors du ticket [Règle de conseil — trésorerie professionnelle dormante](25-conseil-tresorerie-pro.md)) — un Profil/patrimoine distinct par structure, ou de simples métadonnées structurées portées par les comptes/Lignes existants ?

Renforcé par l'export Excel de l'utilisateur : la SARL détient elle-même un portefeuille diversifié (compte courant, bourse, DAT, private equity), pas seulement une trésorerie — le modèle actuel (voir [Modèle de données du patrimoine par domaine](01-modele-patrimoine.md)) ne prévoit de Domaines/Enveloppes/Lignes que pour le patrimoine personnel de l'utilisateur.

À trancher :
- Portée : modéliser la détention par la SARL/SCI dès cet effort, ou explicitement hors scope (v1 = patrimoine personnel uniquement, actifs détenus en société non trackés) ?
- Si dans le scope : Patrimoine net total et vision consolidée incluent-ils ces actifs sociétaires, avec ou sans distinction visuelle/de calcul (ex. IFI qui a ses propres règles d'inclusion des parts de société) ?
- Impact sur Objectifs (un Objectif peut-il se lier à une structure plutôt qu'à un Domaine ou au total ?) et sur le Profil (un seul Profil de risque/TMI pour l'utilisateur, ou une notion de structure distincte à faire porter par certains champs) ?
- Cohérence avec la décision déjà actée sur ce ticket 25 : la règle de trésorerie professionnelle dormante ne s'applique qu'au compte SARL, la SCI en étant exclue — cette même distinction structure-par-structure doit-elle se retrouver ailleurs dans le modèle ?

## Réponse

**Portée retenue (option 1 simplifiée)** : nouveau niveau **Entité**, sibling de la personne, conteneur pour Domaines/Enveloppes/Lignes — sans entrer dans le détail comptable/fiscal propre à chaque forme juridique (pas de comptabilité SARL, pas de fiscalité IS). `perso` existe **implicitement** dès le départ (non supprimable) ; `pro_1`, `sci_1`... sont créées explicitement par l'utilisateur.

**Modèle de l'Entité** : porte un **libellé** libre (ex. "SARL Untel") et un **type** à 3 valeurs — `personnelle` / `activité de service` / `détention immobilière`. Le type permet aux règles de conseil de cibler une catégorie d'Entité plutôt qu'un nom en dur (voir cohérence avec le ticket 25 ci-dessous).

**Profil vs Entité — distinction clarifiée** : le **Profil** (âge, TMI, Plafond PER, situation familiale, Objectifs, Profil de risque) reste **unique**, découplé des Entités — ce n'est pas « une instance de Profil par Entité ». Les Entités sont un concept exclusivement côté patrimoine ; l'Entité `perso` n'est pas le Profil, elle est juste le conteneur qui héberge les Domaines personnels.

**Champs migrés depuis la Ligne liquidités vers l'Entité** : `Perso/Pro` et `Charges fixes professionnelles` (ajoutés aux tickets [Logique de conseil et anomalies — Liquidités](14-conseil-liquidites.md) et [Règle de conseil — trésorerie professionnelle dormante](25-conseil-tresorerie-pro.md)) sont retirés de la Ligne et remontés sur l'Entité — l'appartenance à une Entité typée rend ces champs redondants au niveau Ligne. Détail dans l'amendement posé sur [Modèle de données du patrimoine par domaine](01-modele-patrimoine.md).

**Portée des règles de conseil déjà cadrées** : s'appliquent à **toute Entité qui a le Domaine concerné** (ex. la concentration bourse de `pro_1` est jugée indépendamment de celle de `perso`) — pas de nouveau jeu de règles à inventer, réutilisation Domaine par Domaine quelle que soit l'Entité. La règle trésorerie pro dormante (ticket 25) se généralise ainsi via le champ type (`activité de service`) au lieu de cibler un compte SARL en dur ; la SCI en reste exclue nativement (type `détention immobilière`).

**Patrimoine net total et vision consolidée** : agrégés toutes Entités confondues **par défaut**, détail par Entité disponible au clic — cohérent avec le principe déjà acté de Patrimoine net.

**Objectifs** : le lien patrimoine d'un Objectif (voir [Lien Objectif ↔ patrimoine pour le calcul d'avancée](10-lien-objectif-patrimoine.md)) peut désormais aussi cibler une **Entité**, en plus de Domaine(s) et Patrimoine net total.

**IFI** : le seuil de proximité (ticket [Logique de conseil et anomalies — Immobilier](16-conseil-immobilier.md)) s'agrège désormais sur la valeur immobilière nette de **toutes les Entités confondues** (perso + SCI), sans logique d'exclusion « biens professionnels » propre à l'IFI (trop pointu vu la consigne de ne pas rentrer dans le détail) — même traitement « indicateur de confiance » que les autres approximations déjà actées sur ce calcul.

**Réserve de précaution** (`réserve_pour`) : reste **intra-Entité** — un compte liquidités ne réserve que pour un bien immobilier de la même Entité.

**Hors modélisation, renvoyé à l'implémentation** : le rattachement des comptes SARL/SCI déjà identifiés en session (ticket 25) aux nouvelles Entités `pro_1`/`sci_1` est un détail de migration/implémentation, pas une décision de modélisation.

**Fog surfacé, gradué en ticket** : l'écran de création/gestion des Entités et son impact sur la navigation du dashboard existant (rail Domaines, vision consolidée) — voir [UX multi-Entités — création et navigation](29-ux-multi-entites-navigation.md).

Décidé par grilling avec l'utilisateur.
