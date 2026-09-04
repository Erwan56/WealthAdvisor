# WealthAdvisor

Application personnelle de gestion de patrimoine : centralise l'inventaire du patrimoine de l'utilisateur sur plusieurs domaines (liquidités, bourse, immobilier, assurance-vie/PER, crypto, private equity/autres) et fournit des conseils de placement contextualisés.

## Language

### Structure du patrimoine

**Entité**:
Un conteneur de patrimoine, sibling de la personne — un niveau au-dessus de Domaine. Porte un libellé libre et un type (`personnelle` / `activité de service` / `détention immobilière`). L'Entité `personnelle` (`perso`) existe implicitement dès le départ, non supprimable ; les autres (ex. une SARL, une SCI) sont créées explicitement par l'utilisateur. Chaque Domaine/Enveloppe/Ligne appartient à une Entité. La vision consolidée (Patrimoine net total, reporting) agrège toutes les Entités par défaut, avec détail par Entité disponible. Les règles de conseil déjà cadrées par Domaine s'appliquent à toute Entité qui a ce Domaine ; certaines règles ciblent un type d'Entité précis (ex. trésorerie professionnelle dormante → `activité de service` uniquement, voir [Règle de conseil — trésorerie professionnelle dormante](issues/25-conseil-tresorerie-pro.md)). Voir [Modélisation multi-entités juridiques / sociétés](issues/28-modelisation-multi-entites-juridiques.md).
_Avoid_: Structure, société (trop restrictif — `perso` est aussi une Entité), Profil (concept distinct, voir plus bas).

**Domaine**:
Une catégorie d'actifs du patrimoine, répétée par Entité. Six domaines sont suivis : liquidités, bourse, immobilier, assurance-vie/PER, crypto, private equity/autres.

**Enveloppe**:
Un contenant qui regroupe une ou plusieurs Lignes et porte des métadonnées propres au contenant (libellé, type, date d'ouverture, statut actif/clôturé) — un PEA, un PEA-PME, un CTO, un contrat d'assurance-vie, un contrat PER, un fonds private equity (FCPR/FIP/FCPI/SCPI), un portefeuille crypto par plateforme. Les domaines Liquidités et Immobilier n'ont pas d'Enveloppe : leurs Lignes sont autonomes.
_Avoid_: Compte (au sens générique), contrat, wrapper.

**Ligne**:
Un actif individuel du patrimoine — un titre boursier, un support d'assurance-vie/PER, un actif crypto, une part de fonds, un bien immobilier, un compte de liquidités. Rattachée à une Enveloppe quand son Domaine en a une. Porte un libellé, un domaine, une valeur actuelle, une date de dernière Valorisation et une note libre.
_Avoid_: Position, actif (trop générique), asset.

**Ligne compte espèces** (Bourse) :
La Ligne d'une Enveloppe bourse (PEA/PEA-PME/CTO) qui représente le cash non investi dans la poche de l'enveloppe, plutôt qu'un titre. Une Ligne comme les autres (valeur actuelle, historisée par Valorisations), mais sans nom/ISIN de titre ni prix de revient moyen pondéré. Alimente l'anomalie de cash dormant en portefeuille bourse (seuil : 5 % de la valeur totale de l'Enveloppe), distincte du fonds de précaution générique du Domaine Liquidités.
_Avoid_: liquidités (réservé au Domaine Liquidités, hors Enveloppe bourse), solde.

**Banque** (champ d'une Ligne liquidités) :
L'établissement bancaire qui tient le compte, en champ structuré distinct du libellé libre — permet de distinguer plusieurs comptes de même nature (ex. plusieurs comptes courants) sans dépendre d'une convention de nommage dans le libellé.

**Perso/Pro** _(retiré)_ :
Champ historique de la Ligne liquidités, remplacé par le type de l'Entité propriétaire (`personnelle` vs `activité de service`/`détention immobilière`) — voir [Modélisation multi-entités juridiques / sociétés](issues/28-modelisation-multi-entites-juridiques.md).

**Charges fixes professionnelles** (champ d'une Entité de type `activité de service`) :
Le montant mensuel des charges fixes de l'Entité (loyer de bureau, abonnements, salaire minimal...). Porté par l'Entité (pas le Profil, pas la Ligne) car propre à une structure pro dans son ensemble, contrairement aux Dépenses mensuelles courantes qui sont une notion Profil unique. Base du seuil de trésorerie professionnelle dormante (4 mois de charges fixes professionnelles, voir [Règle de conseil — trésorerie professionnelle dormante](issues/25-conseil-tresorerie-pro.md)) ; règle applicable uniquement aux Entités de type `activité de service` (ex. SARL), pas `détention immobilière` (ex. SCI). Amendement déplacé depuis la Ligne liquidités par [Modélisation multi-entités juridiques / sociétés](issues/28-modelisation-multi-entites-juridiques.md).
_Avoid_: Dépenses mensuelles courantes (réservé au Profil, dépenses de vie personnelles).

**Réserve de précaution** (champ `réserve_pour` d'une Ligne liquidités) :
Référence optionnelle depuis une Ligne liquidités vers une Ligne immobilier, marquant ce compte comme réserve dédiée aux imprévus de ce bien (travaux, ravalement, chaudière...). Alimente un calcul déterministe de surplus investissable (cash au-delà d'une cible de réserve sourcée/ajustable par bien), distinct du calcul d'anomalie « liquidités dormantes » générique qui s'applique aux comptes sans `réserve_pour`. Pas de valeur par défaut.
_Avoid_: Fonds d'urgence (ambigu avec le seuil générique de liquidités dormantes), allocation.

**Mouvement**:
Un événement daté qui modifie la composition du patrimoine — versement, retrait, achat, vente, souscription, rachat. Porte les métadonnées fiscales nécessaires aux calculs déterministes (ex. date d'un versement pour l'ancienneté d'un contrat d'assurance-vie, caractère déductible ou non d'un versement PER, prix unitaire d'un achat crypto). Attaché à l'Enveloppe ou à la Ligne selon le niveau auquel la règle fiscale correspondante s'applique — par exemple le plafond du PEA se suit au niveau de l'Enveloppe, le prix de revient d'un titre CTO au niveau de la Ligne.
_Avoid_: Transaction, opération.

**Valorisation**:
Un instantané daté de la valeur d'une Ligne. Pour l'immobilier, une Valorisation porte aussi les paramètres courants du bien à cette date (capital restant dû, loyer, charges, mensualité). Les Valorisations alimentent la vue consolidée du patrimoine dans le temps, indépendamment des Mouvements — une réévaluation du prix d'un bien n'est pas un Mouvement.
_Avoid_: Snapshot, historique.

**Patrimoine net**:
La valeur d'une Ligne (ou du patrimoine total) diminuée des dettes qui s'y rattachent — pour une Ligne immobilier, valeur estimée du bien moins capital restant dû du prêt à la même date.

**Prix de revient moyen pondéré**:
Le coût d'acquisition moyen d'une Ligne boursière en CTO, dérivé des Mouvements d'achat successifs. Nécessaire pour calculer la plus ou moins-value à la vente ; n'existe pas pour les Lignes en PEA/PEA-PME, dont la fiscalité s'apprécie au niveau de l'Enveloppe et non Ligne par Ligne.

### Profil utilisateur

**Profil**:
L'ensemble des informations personnelles de l'utilisateur qui contextualisent le conseil — date de naissance, horizon global, Objectifs, situation fiscale (TMI saisie directement, Plafond PER annuel saisi directement), situation familiale (statut marital, personnes à charge), et Profil de risque. État courant unique, non historisé dans le temps (contrairement au patrimoine). Concept distinct d'Entité : le Profil n'est jamais dupliqué par Entité (une SARL n'a pas de Profil de risque ou de TMI) — l'Entité `personnelle` n'est pas « le Profil », c'est juste le conteneur qui héberge les Domaines personnels de l'utilisateur. Voir [Modélisation multi-entités juridiques / sociétés](issues/28-modelisation-multi-entites-juridiques.md).
_Avoid_: Profil utilisateur (redondant, un seul profil existe dans l'application), paramètres, Entité (concept de patrimoine distinct, voir plus haut).

**Plafond PER annuel** (champ du Profil) :
Le plafond de déduction fiscale des versements PER de l'année, saisi directement par l'utilisateur depuis le montant déjà calculé sur son avis d'imposition (qui intègre le report des années précédentes) — pas de formule recalculée par l'application (même logique que la TMI). Alimente le suivi déterministe du plafond de déduction PER (voir [Logique de conseil et anomalies — Assurance-vie/PER](issues/17-conseil-assurance-vie-per.md)).
_Avoid_: Plafond épargne retraite (terme administratif de l'avis d'imposition, garder le terme applicatif).

**Dépenses mensuelles courantes** (champ du Profil) :
Le montant mensuel des dépenses de l'utilisateur, saisi directement (même pattern que la TMI/le Plafond PER annuel, pas de calcul dérivé des Mouvements). Base des règles de liquidités dormantes sur les comptes personnels (voir [Logique de conseil et anomalies — Liquidités](issues/14-conseil-liquidites.md)).
_Avoid_: Budget, revenus (la convention retenue raisonne en dépenses, pas en revenus).

**Mois de réserve visés** (champ du Profil) :
Paramètre éditable fixant la cible du fonds de précaution générique (en mois de Dépenses mensuelles courantes), évaluée sur le total agrégé des livrets personnels. Valeur par défaut 6 mois. Même logique de paramètre ajustable que la cible de Réserve de précaution par bien immobilier, mais au niveau du Profil plutôt que par Ligne.
_Avoid_: Fonds d'urgence (le concept applicatif est le seuil calculé à partir de ce paramètre, pas le paramètre lui-même).

**Objectif**:
Un but patrimonial nommé de l'utilisateur — retraite, achat immobilier, transmission, sécurité/urgence, ou projet libre — avec un libellé, un horizon propre et un montant cible optionnel. Distinct de l'horizon global du Profil, qui sert de référence quand le conseil ne se rattache à aucun Objectif précis.
_Avoid_: But, projet (sauf comme type d'Objectif "projet libre").

**Lien patrimoine** (d'un Objectif):
Le rattachement configurable d'un Objectif à tout ou partie du patrimoine, utilisé pour calculer son avancée (barre de progression) par rapport à son montant cible — soit le Patrimoine net total, soit un ou plusieurs Domaines nommément désignés. Pas de valeur par défaut : un Objectif nouvellement créé n'a pas d'avancée affichée tant que ce lien n'est pas réglé explicitement. Le calcul s'appuie sur le Patrimoine net (et non la valeur brute) ; un même Domaine peut être lié à plusieurs Objectifs simultanément sans restriction (double-compte accepté).
_Avoid_: Allocation, répartition (implique une exclusivité qui n'existe pas ici).

**Date d'atteinte estimée** (indicateur calculé d'un Objectif) :
Projection de la date à laquelle un Objectif atteindra son montant cible, calculée en dur par tendance linéaire sur tout l'historique de Valorisations disponible de son Lien patrimoine (pas seulement les derniers points, pour lisser le bruit d'une saisie irrégulière) ; comparée à l'horizon propre de l'Objectif pour exprimer une avance/un retard. Pas affichée si l'historique disponible a moins de 2 points, ou si la tendance est plate/négative (message qualitatif à la place). Voir [Estimation de date d'atteinte d'un Objectif](issues/26-estimation-date-objectif.md).
_Avoid_: Date cible (réservée à l'horizon saisi par l'utilisateur, pas à cette projection calculée).

**Profil de risque**:
La tolérance au risque de l'utilisateur, réduite à un bucket (prudent/équilibré/dynamique) et un niveau de connaissance des marchés (novice/initié/expert). Caractérisation qualitative transmise en contexte au moteur de conseil — ne produit pas d'allocation cible chiffrée par domaine. Déterminé par le Questionnaire de risque ; peut être ajusté manuellement en chat, mais cet override est écrasé au prochain passage du questionnaire.
_Avoid_: Tolérance au risque (utiliser Profil de risque), score (le score est un détail interne du Questionnaire de risque, pas le concept exposé).

**Questionnaire de risque**:
Un jeu de 4 questions scorées (réaction à une perte simulée, horizon, connaissance des marchés, priorité sécurité vs performance) dont le score détermine le Profil de risque.
_Avoid_: Test de risque, quiz.
