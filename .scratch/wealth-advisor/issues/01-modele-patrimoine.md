# Modèle de données du patrimoine par domaine

Type: grilling
Status: resolved
Claimed-by: session_01QHgdqVt4UM28nW12uKohYu

## Question

Pour chaque domaine retenu (liquidités, bourse [PEA/CTO], immobilier, assurance-vie/PER, crypto, private equity/autres), quels champs structurés faut-il capturer — à la création d'une ligne de patrimoine et à chaque mise à jour historisée — pour permettre :

1. une vision consolidée du patrimoine total et par domaine ;
2. les calculs déterministes nécessaires au moteur de conseil (ex. rendement locatif et cash-flow pour l'immobilier, suivi du plafond de versement PEA, plus-value latente...).

À trancher :
- Champs **communs** à toutes les lignes de patrimoine (libellé, domaine, valeur actuelle, date de dernière mise à jour, éventuellement une note libre) vs champs **spécifiques** à chaque domaine (ex. immobilier : prix d'achat, prêt restant dû, mensualité, loyers perçus, charges ; bourse : enveloppe PEA vs CTO, montant des versements cumulés pour le suivi du plafond ; assurance-vie/PER : date d'ouverture du contrat, versements cumulés).
- Format de l'historisation : une entrée datée par mise à jour de valeur, avec quels champs figés dans le temps vs recalculés.
- Identifiants et regroupement (ex. plusieurs lignes bourse au sein d'une même enveloppe PEA).

## Answer

Modèle à deux niveaux **Enveloppe** (regroupement — PEA/PEA-PME/CTO, contrat assurance-vie, contrat PER, fonds private equity/SCPI, portefeuille crypto par plateforme) + **Ligne** (actif individuel). Liquidités et Immobilier n'ont pas d'Enveloppe : ligne seule. Terminologie et structure détaillée consignées dans [`CONTEXT.md`](../CONTEXT.md).

Points clés :
- **Historisation en deux flux** : Mouvements typés et horodatés (versement, retrait, achat, vente, souscription, rachat) qui portent les métadonnées fiscales nécessaires aux calculs déterministes ; Valorisations périodiques datées (snapshot de valeur) pour la vue consolidée dans le temps.
- **Champs communs** : Ligne (id, libellé, domaine, enveloppe parente optionnelle, valeur actuelle, date de dernière valorisation, note libre) ; Enveloppe (id, libellé, type, date d'ouverture, statut actif/clôturé).
- **Champs spécifiques par domaine, fixes et typés** (pas de schéma libre) :
  - Immobilier (ligne seule) : prix d'acquisition total, date d'acquisition, résidence principale, régime de location ; valeur estimée, capital restant dû, loyer/charges/taxe foncière/assurance/frais de gestion/mensualité en paramètres courants historisés à chaque valorisation.
  - Bourse : ligne = titre (nom/ISIN, quantité, valeur actuelle) + prix de revient moyen pondéré pour les lignes en CTO uniquement.
  - Assurance-vie/PER : ligne = support (nom, type fonds euro/UC, valeur actuelle).
  - Crypto : enveloppe = portefeuille par plateforme (+ indicateur plateforme étrangère, + prix d'acquisition cumulé) ; ligne = actif (symbole, quantité, valeur actuelle).
  - Private equity/SCPI : enveloppe = fonds (+ type de dispositif, + durée de blocage) ; ligne = part souscrite (nombre de parts, valeur actuelle estimée).
  - Liquidités (ligne seule) : type de compte, plafond du livret, taux de rémunération actuel, `réserve_pour` (référence optionnelle vers une Ligne immobilier — voir amendement ci-dessous).
- **Devise** : euros uniquement.
- **Attachement des mouvements** : au niveau (Enveloppe ou Ligne) où la règle fiscale correspondante s'applique — détail dans le corps de la discussion de ce ticket et dans `CONTEXT.md`.

Décidé par grilling avec l'utilisateur, en s'appuyant sur le recensement fiscal de [Règles fiscales et légales françaises par domaine](03-regles-fiscales-legales.md).

## Amendement (voir [Réserve de précaution immobilier et arbitrage liquidités ↔ investissement](13-reserve-precaution-immobilier.md))

Ajout du champ optionnel `réserve_pour` sur la Ligne liquidités : référence une Ligne immobilier pour marquer un compte comme réserve de précaution dédiée à ce bien (travaux imprévus, ravalement, chaudière...). Permet à la couche déterministe de calculer un surplus investissable par bien plutôt qu'un simple seuil global de liquidités dormantes. Champ optionnel, sans valeur par défaut.

## Amendement (voir [Logique de conseil et anomalies — Bourse](15-conseil-bourse.md))

Ajout d'une Ligne "compte espèces" au sein d'une Enveloppe bourse (PEA/PEA-PME/CTO) : une Ligne comme les autres (valeur actuelle, historisée par Valorisations) mais sans prix de revient moyen pondéré et sans nom/ISIN de titre, représentant le cash non investi dans la poche de l'enveloppe. Nécessaire pour détecter l'anomalie de cash dormant en portefeuille bourse — sans cette Ligne, le cash resté sur le compte espèces d'un PEA n'était pas représentable distinctement des titres.

## Amendement (voir [Logique de conseil et anomalies — Liquidités](14-conseil-liquidites.md))

Ajout de deux champs structurés sur la Ligne liquidités : **Banque** (établissement bancaire) et **Perso/Pro** (nature du compte). Nécessaire car l'utilisateur détient plusieurs comptes courants de même type (3 personnels, 2 professionnels liés à une activité indépendante) — le libellé libre existant ne suffisait pas à les distinguer de façon structurée, et le champ Perso/Pro conditionne l'application des règles de conseil sur les liquidités dormantes (comptes professionnels exclus, voir [Logique de conseil et anomalies — Liquidités](14-conseil-liquidites.md)).

## Amendement (voir [Règle de conseil — trésorerie professionnelle dormante](25-conseil-tresorerie-pro.md))

Ajout du champ optionnel **Charges fixes professionnelles** sur la Ligne liquidités (pertinent uniquement quand Perso/Pro = Pro). Porté par la Ligne (pas le Profil) car il s'agit d'une charge propre à une structure pro particulière, pas d'une notion « utilisateur » unique. Sert de base au seuil de trésorerie professionnelle dormante (4 mois de charges fixes professionnelles) ; la règle de conseil correspondante ne s'applique qu'aux comptes pro rattachés à une activité de service/indépendante (typiquement une SARL), pas à un compte pro rattaché à une société de détention immobilière (SCI) — la distinction entre ces deux natures de structure pro n'est pas encore portée par un champ structuré dédié, elle reste une convention d'usage au moment de la saisie (voir fog « Modélisation multi-entités juridiques / sociétés » sur la carte).

**Amendement remplacé par le ticket [Modélisation multi-entités juridiques / sociétés](28-modelisation-multi-entites-juridiques.md) ci-dessous** : `Perso/Pro` et `Charges fixes professionnelles` ne sont plus des champs de la Ligne liquidités.

## Amendement (voir [Modélisation multi-entités juridiques / sociétés](28-modelisation-multi-entites-juridiques.md))

**Nouveau niveau Entité**, sibling de la personne, au-dessus de Domaine : `Entité { id, libellé, type }` où `type ∈ {personnelle, activité de service, détention immobilière}`. Chaque Domaine/Enveloppe/Ligne existant appartient désormais à une Entité plutôt qu'implicitement au patrimoine personnel unique. L'Entité `personnelle` existe implicitement (non supprimable) ; les autres sont créées explicitement par l'utilisateur.

**Champs retirés de la Ligne liquidités, remontés sur l'Entité** : `Perso/Pro` (redondant avec le type de l'Entité) et `Charges fixes professionnelles` (propre à une Entité de type `activité de service` dans son ensemble, pas à un compte particulier).

**Champ `Banque` inchangé** sur la Ligne liquidités — reste nécessaire pour distinguer plusieurs comptes de même nature au sein d'une même Entité.

Le Profil reste unique, non porté par l'Entité — voir la réponse du ticket lié pour la distinction Profil/Entité.
