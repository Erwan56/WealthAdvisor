# Modèle de profil utilisateur & méthodologie de profil de risque

Type: grilling
Status: resolved
Claimed-by: session_01QHgdqVt4UM28nW12uKohYu

## Question

Quels champs exacts composent le profil utilisateur (âge, horizon de placement, tolérance au risque, objectifs, situation fiscale/TMI, situation familiale) et comment sont-ils obtenus (questionnaire structuré, saisie libre en chat, mix des deux) ?

Comment le profil de risque et une éventuelle allocation cible sont-ils déterminés à partir de ces réponses ? Quelle méthodologie retenir (buckets simples type prudent/équilibré/dynamique, scoring pondéré, approche inspirée de la théorie moderne du portefeuille) et à quel niveau de rigueur, compte tenu du moteur hybride retenu (voir [Conception du moteur de conseil hybride](04-moteur-conseil-hybride.md)) ?

## Answer

**Profil de risque qualitatif, pas d'allocation cible chiffrée** : le Profil de risque se réduit à un bucket (prudent/équilibré/dynamique) + un niveau de connaissance des marchés (novice/initié/expert), transmis en contexte au LLM plutôt que traduit en grille d'allocation figée en dur — cohérent avec le principe du moteur hybride où le "dur" reste réservé aux calculs fiscaux/légaux objectifs.

**Méthodologie** : Questionnaire de risque scoré de 4 questions (réaction à une perte simulée, horizon, connaissance des marchés, priorité sécurité vs performance) → 3 buckets. Override manuel du bucket possible via chat, mais écrasé au prochain passage du questionnaire (une seule source de vérité).

**Objectifs** : liste d'Objectifs typés (retraite, achat immobilier, transmission, sécurité/urgence, projet libre), chacun avec libellé, horizon propre et montant cible optionnel — en plus d'un horizon global de référence pour le conseil qui ne se rattache à aucun Objectif précis.

**Situation fiscale/familiale** : TMI saisie directement (pas de calcul depuis le barème IR, qui change chaque année) ; situation familiale limitée à statut marital + personnes à charge (seuls champs utilisés par une règle déterministe déjà recensée — abattement assurance-vie).

**Âge** : stocké comme date de naissance (recalculé à l'usage), pas comme entier figé.

**Saisie** : formulaire structuré (champs factuels + Questionnaire de risque) + chat pour ajuster/discuter après coup — même pattern que la saisie du patrimoine.

**Historisation** : état courant simple, non versionné dans le temps (contrairement au patrimoine).

Terminologie consignée dans [`CONTEXT.md`](../CONTEXT.md) (Profil, Objectif, Profil de risque, Questionnaire de risque).

Décidé par grilling avec l'utilisateur.

## Amendement (voir [Logique de conseil et anomalies — Assurance-vie/PER](17-conseil-assurance-vie-per.md))

Ajout du champ **« Plafond PER annuel »** au Profil : saisi directement par l'utilisateur depuis le montant déjà calculé sur son avis d'imposition (qui intègre le report des années précédentes) — même pattern que la TMI, aucune formule de plafond recalculée par l'app. Alimente la règle déterministe de suivi du plafond de déduction PER (déclenchement à 80 % du plafond utilisé).

## Amendement (voir [Logique de conseil et anomalies — Liquidités](14-conseil-liquidites.md))

Ajout de deux champs au Profil :
- **Dépenses mensuelles courantes** : saisi directement par l'utilisateur (même pattern que la TMI/le Plafond PER annuel, pas de calcul dérivé des Mouvements). Base des règles de liquidités dormantes.
- **Mois de réserve visés** : paramètre éditable, valeur par défaut 6 mois (milieu de la fourchette usuelle 3-6 mois pour un salarié stable). Cible le fonds de précaution générique sur livrets.
