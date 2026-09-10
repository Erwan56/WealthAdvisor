# WealthAdvisor

Application personnelle de gestion de patrimoine : centralise l'inventaire du patrimoine de l'utilisateur sur plusieurs domaines (liquidités, bourse, immobilier, assurance-vie/PER, crypto, private equity/autres) et fournit des conseils de placement contextualisés.

## Language

### Structure du patrimoine

**Entité**:
Un conteneur de patrimoine, sibling de la personne — un niveau au-dessus de Domaine. Porte un libellé libre, un type (`personnelle` / `activité de service` / `détention immobilière`) et, pour `activité de service`, des Charges fixes professionnelles. L'Entité `personnelle` (`perso`) existe implicitement dès le départ, non supprimable ; les autres (ex. une SARL, une SCI) sont créées et gérées (libellé, type, Charges fixes professionnelles) depuis l'écran de Configuration globale, partagé avec la gestion des Banques (voir [Banques — liste prédéfinie et écran de configuration globale](../refonte-saisie-patrimoine/issues/05-banques-configuration.md)). Chaque Enveloppe et chaque Ligne porte son propre `entity_id`, toujours synchronisés (une Ligne d'une Enveloppe hérite de l'Entité de son Enveloppe) — l'Entité est choisie explicitement à la création (de l'Enveloppe pour les Domaines qui en ont une, de la Ligne pour Liquidités/Immobilier), jamais déduite d'une sélection de navigation. Les Dashboards par Domaine n'ont plus d'onglet par Entité : une seule vue agrégée, avec une colonne Entité par ligne (voir [Modèle Entité — attribut par Ligne vs conteneur hiérarchique](../refonte-saisie-patrimoine/issues/01-modele-entite.md)). Les règles de conseil déjà cadrées par Domaine s'appliquent à toute Entité qui a ce Domaine ; certaines règles ciblent un type d'Entité précis (ex. trésorerie professionnelle dormante → `activité de service` uniquement, voir [Règle de conseil — trésorerie professionnelle dormante](issues/25-conseil-tresorerie-pro.md)). Voir [Modélisation multi-entités juridiques / sociétés](issues/28-modelisation-multi-entites-juridiques.md).
_Avoid_: Structure, société (trop restrictif — `perso` est aussi une Entité), Profil (concept distinct, voir plus bas).

**Domaine**:
Une catégorie d'actifs du patrimoine, répétée par Entité. Six domaines sont suivis : liquidités, bourse, immobilier, assurance-vie/PER, crypto, private equity/autres.

**Enveloppe**:
Un contenant qui regroupe zéro, une ou plusieurs Lignes et porte des métadonnées propres au contenant (libellé, type, date d'ouverture, statut actif/clôturé) — un PEA, un PEA-PME, un CTO, un contrat d'assurance-vie, un contrat PER, un fonds private equity (FCPR/FIP/FCPI/SCPI), un portefeuille crypto par plateforme. Se crée vide : le premier élément se saisit ensuite par le même bouton "+" qu'un élément suivant, aucun Domaine ne force plus la saisie d'un premier élément à la création (voir [Création d'Enveloppe sans élément obligatoire](../refonte-saisie-patrimoine/issues/07-creation-enveloppe-sans-premier-element.md)). Les domaines Liquidités et Immobilier n'ont pas d'Enveloppe : leurs Lignes sont autonomes. Terme interne/technique transverse uniquement (glossaire, `PRD.md`, moteur de conseil, noms de composants/tables) — jamais montré à l'utilisateur : chaque Domaine a son propre nom d'écran (Compte pour Bourse, contrat pour Assurance-vie/PER, portefeuille pour Crypto, fonds pour PE/SCPI). Voir [Terminologie Enveloppe — cohérence à travers les domaines](../refonte-saisie-patrimoine/issues/06-terminologie-enveloppe.md).
_Avoid_ (comme terme générique transverse) : Compte, contrat, wrapper — mais "Compte" est le libellé correct spécifique au Domaine Bourse (pas une contradiction : deux rôles distincts, générique vs. par-Domaine).

**Ligne**:
Un actif individuel du patrimoine — un titre boursier, un support d'assurance-vie/PER, un actif crypto, une part de fonds, un bien immobilier, un compte de liquidités. Rattachée à une Enveloppe quand son Domaine en a une. Porte un libellé, un domaine, une valeur actuelle, une date de dernière Valorisation et une note libre.
_Avoid_: Position, actif (trop générique), asset.

**Ligne compte espèces** (Bourse) :
La Ligne d'une Enveloppe bourse (PEA/PEA-PME/CTO) qui représente le cash non investi dans la poche de l'enveloppe, plutôt qu'un titre. Une Ligne comme les autres (valeur actuelle, historisée par Valorisations), mais sans nom/ISIN de titre ni prix de revient moyen pondéré. Alimente l'anomalie de cash dormant en portefeuille bourse (seuil : 5 % de la valeur totale de l'Enveloppe), distincte du fonds de précaution générique du Domaine Liquidités.
_Avoid_: liquidités (réservé au Domaine Liquidités, hors Enveloppe bourse), solde.

**Banque** (champ d'une Ligne liquidités) :
L'établissement bancaire qui tient le compte, en liste prédéfinie éditable par l'utilisateur depuis l'écran de Configuration globale (persistée en base, pas une liste statique versionnée dans le code) — remplace l'ancien champ texte libre. Liste de départ : BNP Paribas, Crédit Agricole, Société Générale, LCL, Banque Postale, Caisse d'Épargne, Crédit Mutuel, CIC, Banque Populaire, HSBC Continental Europe, BoursoBank, Fortuneo, Hello bank!, Monabanq, Revolut, N26 — sans valeur "Autre" : une banque absente s'ajoute directement à la liste depuis la Configuration globale plutôt que de passer par un fourre-tout. Voir [Banques — liste prédéfinie et écran de configuration globale](../refonte-saisie-patrimoine/issues/05-banques-configuration.md).

**Type de compte** (champ d'une Ligne liquidités) :
La nature du compte (Compte courant, Livret A, LDDS, LEP, Compte à terme, Autre), en liste prédéfinie éditable par l'utilisateur depuis l'écran de Configuration globale — remplace l'ancien champ texte libre. Ne porte pas lui-même la notion rémunéré/non-rémunéré : ce caractère se lit directement sur le champ `taux` de la Ligne (`taux > 0` ⇒ rémunéré), pas sur la valeur choisie ici. Voir [Formulaire Liquidités — type de compte et suppression du mouvement](../refonte-saisie-patrimoine/issues/04-formulaire-liquidites.md).
_Avoid_: Nature de compte, catégorie (le champ applicatif est "type de compte").

**Configuration globale** (écran) :
Écran top-level dédié à la gestion des listes de référence transverses de l'application, avec sa propre entrée dans la navigation principale — distinct de Profil, qui porte les données personnelles de conseil (naissance, TMI, plafond PER, profil de risque) et non des listes de référence. Regroupe, via une sous-navigation interne (onglets), trois sections dès la V1 : Entités (libellé, type, Charges fixes professionnelles), Banques, Types de compte Liquidités. CRUD complet (ajout, édition, suppression) sur chacune des trois listes ; suppression bloquée avec message explicatif si la valeur est déjà référencée par une Ligne/Enveloppe/Entité existante — même principe que le compte espèces Liquidités, qui ne peut pas être supprimé tant qu'il est utilisé. Voir [Banques — liste prédéfinie et écran de configuration globale](../refonte-saisie-patrimoine/issues/05-banques-configuration.md).
_Avoid_: Paramètres (trop générique), Profil (concept distinct — données de conseil personnelles, pas des listes de référence).

**Perso/Pro** _(retiré)_ :
Champ historique de la Ligne liquidités, remplacé par le type de l'Entité propriétaire (`personnelle` vs `activité de service`/`détention immobilière`) — voir [Modélisation multi-entités juridiques / sociétés](issues/28-modelisation-multi-entites-juridiques.md).

**Charges fixes professionnelles** (champ d'une Entité de type `activité de service`) :
Le montant mensuel des charges fixes de l'Entité (loyer de bureau, abonnements, salaire minimal...). Porté par l'Entité (pas le Profil, pas la Ligne) car propre à une structure pro dans son ensemble, contrairement aux Dépenses mensuelles courantes qui sont une notion Profil unique. Base du seuil de trésorerie professionnelle dormante (4 mois de charges fixes professionnelles, voir [Règle de conseil — trésorerie professionnelle dormante](issues/25-conseil-tresorerie-pro.md)) ; règle applicable uniquement aux Entités de type `activité de service` (ex. SARL), pas `détention immobilière` (ex. SCI). Amendement déplacé depuis la Ligne liquidités par [Modélisation multi-entités juridiques / sociétés](issues/28-modelisation-multi-entites-juridiques.md).
_Avoid_: Dépenses mensuelles courantes (réservé au Profil, dépenses de vie personnelles).

**Réserve de précaution** (champ `réserve_pour` d'une Ligne liquidités) :
Référence optionnelle depuis une Ligne liquidités vers une Ligne immobilier, marquant ce compte comme réserve dédiée aux imprévus de ce bien (travaux, ravalement, chaudière...). Alimente un calcul déterministe de surplus investissable (cash au-delà d'une cible de réserve sourcée/ajustable par bien), distinct du calcul d'anomalie « liquidités dormantes » générique qui s'applique aux comptes sans `réserve_pour`. Pas de valeur par défaut.
_Avoid_: Fonds d'urgence (ambigu avec le seuil générique de liquidités dormantes), allocation.

**Mouvement**:
Un événement daté qui modifie la composition du patrimoine — versement, retrait, achat, vente, souscription, rachat. Porte les métadonnées fiscales nécessaires aux calculs déterministes (ex. date d'un versement pour l'ancienneté d'un contrat d'assurance-vie, caractère déductible ou non d'un versement PER). Attaché à l'Enveloppe ou à la Ligne selon le niveau auquel la règle fiscale correspondante s'applique — par exemple le prix de revient d'un titre CTO au niveau de la Ligne (illustration de principe : aucune règle fiscale n'est aujourd'hui suivie au niveau Enveloppe — le suivi du plafond de versement PEA a été envisagé puis explicitement écarté, voir [Logique de conseil et anomalies — Bourse](issues/15-conseil-bourse.md), "Écarté explicitement"). N'existe plus pour le Domaine Liquidités (Mouvement retiré du flux, la Ligne ne porte plus que Valorisations — voir [Formulaire Liquidités — type de compte et suppression du mouvement](../refonte-saisie-patrimoine/issues/04-formulaire-liquidites.md)), pour Bourse (voir [Mise à jour d'une Ligne Bourse existante — rôle du Mouvement](../refonte-saisie-patrimoine/issues/09-maj-ligne-bourse.md)), ni pour Crypto/Private equity-SCPI (même défaut que Bourse — mouvement décoratif sans effet sur la quantité/le nombre de parts détenu, voir [Mise à jour d'une Ligne Crypto/PE-SCPI — aligner sur la décision Bourse](../refonte-saisie-patrimoine/issues/12-maj-ligne-crypto-pescpi.md)) — seul Assurance-vie/PER garde un Mouvement en saisie (les deux règles de conseil actives, seuil 150k€ AV et plafond PER annuel, en dépendent), réduit à un unique type `versement` (`rachat`/`arbitrage` retirés, purement décoratifs comme partout ailleurs) saisi via un choix explicite "Versement associé à cette entrée ?" (Oui/Non, Oui par défaut) plutôt qu'une disclosure optionnelle repliée — voir [Rôle du Mouvement "versement" — Assurance-vie/PER](../refonte-saisie-patrimoine/issues/13-mouvement-versement-avper.md).
_Avoid_: Transaction, opération.

**Valorisation**:
Un instantané daté de la valeur d'une Ligne. Pour l'immobilier, une Valorisation porte aussi les paramètres locatifs courants du bien à cette date : loyer, charges, taxe foncière, assurance, frais de gestion — des faits réellement saisis, éditables sans créer un nouveau point d'historique via une action "Modifier" dédiée qui met à jour la dernière Valorisation en place (ni un Mouvement, ni une nouvelle Valorisation). Capital restant dû et mensualité n'en font plus systématiquement partie : sur une Ligne sans Prêt immobilier configuré ce sont encore des champs manuels par Valorisation (comportement inchangé) ; sur une Ligne avec Prêt configuré, ce sont des valeurs calculées à la volée depuis le Prêt, à toute date y compris passée — plus un fait porté par la Valorisation elle-même. Les Valorisations alimentent la vue consolidée du patrimoine dans le temps, indépendamment des Mouvements — une réévaluation du prix d'un bien n'est pas un Mouvement. Voir [Refonte de la saisie Immobilier — calcul du capital restant dû et édition des paramètres locatifs](../refonte-saisie-patrimoine/issues/10-refonte-saisie-immobilier.md).
_Avoid_: Snapshot, historique.

**Prêt immobilier** (champs d'une Ligne immobilier) :
Le prêt finançant un bien, porté par la Ligne (pas par Valorisation) et optionnel — un bien acheté comptant n'en a pas. Quatre champs : capital emprunté initial, taux annuel, durée, date de départ. Amortissement classique français à mensualités constantes : dès qu'un Prêt est configuré, capital restant dû et mensualité cessent d'être saisis à la main et deviennent calculés à la volée par la formule d'amortissement, à toute date (y compris les Valorisations déjà passées) — jamais stockés, donc une correction ultérieure d'un des quatre champs (coquille sur le taux, par exemple) se répercute immédiatement sur tout l'affichage, passé compris. L'historique de capital restant dû déjà saisi à la main avant la configuration du Prêt n'est en revanche jamais réécrit rétroactivement. La date de fin de prêt (date de départ + durée) remplace, pour une Ligne avec Prêt configuré, l'estimation par tendance linéaire sur l'historique (qui reste le seul recours pour une Ligne sans Prêt configuré). Renégociation de taux et remboursement anticipé partiel ne sont pas modélisés pour l'instant. Voir [Refonte de la saisie Immobilier — calcul du capital restant dû et édition des paramètres locatifs](../refonte-saisie-patrimoine/issues/10-refonte-saisie-immobilier.md).
_Avoid_: Mensualité, capital restant dû (les champs du Prêt sont capital emprunté initial/taux/durée/date de départ — mensualité et capital restant dû sont ce qui s'en déduit, pas des champs du Prêt lui-même).

**Patrimoine net**:
La valeur d'une Ligne (ou du patrimoine total) diminuée des dettes qui s'y rattachent — pour une Ligne immobilier, valeur estimée du bien moins capital restant dû du prêt à la même date.

**Coût d'acquisition unitaire** (Bourse) :
Le coût d'acquisition moyen d'une Ligne boursière, saisi manuellement (pas dérivé des Mouvements d'achat, malgré une formulation plus ambitieuse du PRD initial — cohérent avec l'implémentation CTO déjà en place), obligatoire à la création d'un titre (voir [Formulaire +titre Bourse — coût d'acquisition, date d'achat, retrait de la valorisation manuelle](../refonte-saisie-patrimoine/issues/08-formulaire-titre-bourse.md)) car il sert désormais de seule base à la Valeur actuelle initiale. Un seul champ, un seul usage pour toutes les Enveloppes Bourse (PEA/PEA-PME/CTO), mais deux lectures : sur CTO c'est le **Prix de revient moyen pondéré** au sens fiscal (nécessaire au calcul de la plus ou moins-value imposable à la vente — la fiscalité PEA/PEA-PME s'apprécie elle au niveau de l'Enveloppe, pas Ligne par Ligne, donc ce même champ y reste purement informational) ; sur toutes les Enveloppes il sert de base à la Plus-value latente affichée à des fins de suivi de performance. Libellé UI : "Coût d'acquisition unitaire" (PEA/PEA-PME), "Prix de revient moyen pondéré unitaire" (CTO). Voir [Extension du coût d'acquisition aux PEA/PEA-PME](../valorisation-bourse-temps-reel/issues/02-cout-acquisition-pea.md) et [Modèle de données — ISIN, coût d'acquisition, contrat de l'endpoint refresh](../valorisation-bourse-temps-reel/issues/06-modele-donnees-refresh.md).
_Avoid_: Prix de revient moyen pondéré / PRU (réservé à la lecture fiscale CTO de ce même champ, pas au champ lui-même) ; libellés sans "unitaire" (ambigus unitaire/total).

**Date d'achat** (champ d'une Ligne titre Bourse) :
Champ manuel sur la Ligne, saisi à la création d'un titre et éditable ensuite, purement informationnel pour l'instant (aucune règle de conseil n'en dépend) — distinct du Mouvement achat/vente (voir [Mise à jour d'une Ligne Bourse existante — rôle du Mouvement](../refonte-saisie-patrimoine/issues/09-maj-ligne-bourse.md), qui porte sur les achats/ventes *ultérieurs*, une fois le titre déjà en portefeuille, pas sur la position initiale). Remplace le champ "Date de la valorisation" du formulaire de création : la première Valorisation de la Ligne est désormais enregistrée à cette date. Voir [Formulaire +titre Bourse](../refonte-saisie-patrimoine/issues/08-formulaire-titre-bourse.md).

**ISIN** (Bourse) :
Identifiant structuré et validé (12 caractères : code pays + identifiant + chiffre de contrôle, validation de format seule) d'une Ligne boursière, remplaçant l'ancien champ texte libre « Nom / ISIN » qui mélangeait nom du titre et identifiant. Sert à interroger la source de cours externe lors du refresh. Le nom du titre reste porté séparément par `Ligne.libelle`. Voir [Champ ISIN dédié et migration](../valorisation-bourse-temps-reel/issues/03-champ-isin.md).

**Plus-value latente** (Bourse) :
`Valeur actuelle − quantité × Coût d'acquisition unitaire` d'une Ligne boursière, affichée par Ligne et agrégée par Enveloppe à des fins de suivi de performance (toutes Enveloppes) — et séparément, avant fiscalité, dans l'angle de conseil fiscal CTO (flat tax). Non calculée (affichage « — ») tant que le coût d'acquisition ou une Valorisation ne sont pas renseignés pour la Ligne. Voir [Modèle de données — ISIN, coût d'acquisition, contrat de l'endpoint refresh](../valorisation-bourse-temps-reel/issues/06-modele-donnees-refresh.md).

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
Paramètre éditable fixant la cible du fonds de précaution générique (en mois de Dépenses mensuelles courantes), évaluée sur le total agrégé des livrets personnels — une Ligne liquidités d'une Entité `personnelle` est un livret personnel dès lors que son `taux > 0` (rémunéré), indépendamment du Type de compte choisi (voir [Formulaire Liquidités — type de compte et suppression du mouvement](../refonte-saisie-patrimoine/issues/04-formulaire-liquidites.md)). Valeur par défaut 6 mois. Même logique de paramètre ajustable que la cible de Réserve de précaution par bien immobilier, mais au niveau du Profil plutôt que par Ligne.
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
