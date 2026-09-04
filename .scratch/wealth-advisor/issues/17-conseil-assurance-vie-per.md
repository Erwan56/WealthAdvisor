# Logique de conseil et anomalies — Assurance-vie/PER

Type: grilling
Status: resolved
Claimed-by: session_01XoLJJEihPVwiZUVYQx1TvJ
Blocked by: 01, 03, 04

## Question

Suite au ticket [Conception du moteur de conseil hybride](04-moteur-conseil-hybride.md), définir la logique de conseil déterministe propre au domaine Assurance-vie/PER :

- Arbitrages selon la fiscalité et la durée de détention déjà recensées dans [Règles fiscales et légales françaises par domaine](03-regles-fiscales-legales.md) (ex. franchissement du cap des 8 ans pour l'assurance-vie, plafonds de déduction PER) — quelles anomalies/rappels déterministes en tirer ?
- Répartition fonds euro vs unités de compte : faut-il une règle déterministe de détection de sous/sur-exposition selon le Profil de risque, ou ce point reste-t-il qualitatif côté LLM ?
- Anomalies proactives propres à ce domaine — à explorer en session.

**Cadrage déjà tranché (à ne pas rouvrir)** : socle minimal, 2 à 4 règles/angles maximum ; formules usuelles sourcées si convention établie existe, seuils tranchés en jugement personnel sinon ; le LLM ne recalcule jamais un chiffre ; le Profil de risque reste qualitatif (bucket + connaissance des marchés), pas d'allocation cible chiffrée générée en dur au-delà d'un éventuel seuil d'anomalie interne (cf. précédent identique tranché pour crypto/PE dans [Logique de conseil et anomalies — Crypto & Private equity/autres](18-conseil-crypto-pe.md)).

## Réponse

Socle de **3 règles déterministes**, toutes calculées en dur et transmises en contexte au LLM (jamais recalculées) :

1. **AV — passage du cap des 8 ans** (par contrat/Enveloppe) : alerte proactive **6 mois avant** l'anniversaire des 8 ans (date d'ouverture + 8 ans − 6 mois), puis note ponctuelle au franchissement effectif. Objectif : permettre de retarder un rachat pour bénéficier du taux réduit sur la part IR (7,5 % + abattement annuel plutôt que 12,8 %, cf. [Règles fiscales et légales françaises par domaine](03-regles-fiscales-legales.md) §2.1-2.2).

2. **AV — seuil des 150 000 € de versements cumulés par assuré** (tous contrats AV confondus, gouverne le taux 7,5 % vs 12,8 % sur les contrats 8 ans et plus, §2.3) : calcul déterministe = somme des Mouvements de versement sur toutes les Enveloppes assurance-vie. Déclenchement **proactif dès qu'il reste ≤ 20 000 €** avant le plafond (cumul ≥ 130 000 €).

3. **PER — plafond de déduction annuel** : la formule légale exacte (§3.1-3.2) dépend du revenu professionnel de l'année précédente et du statut salarié/TNS, non captés dans le Profil. Plutôt que modéliser cette formule, un nouveau champ **« Plafond PER annuel »** est ajouté au Profil (amendement porté sur [Modèle de profil utilisateur & méthodologie de profil de risque](02-profil-risque.md)) : saisi directement par l'utilisateur depuis le montant déjà calculé sur son avis d'imposition (qui intègre le report des années précédentes) — même pattern que la TMI, aucune formule recalculée par l'app. Calcul déterministe = somme des Mouvements de versement PER de l'année civile en cours sur toutes les Enveloppes PER, comparée à ce plafond stocké. Déclenchement **proactif à 80 % du plafond utilisé** (pourcentage plutôt que montant fixe, le plafond variant fortement d'une personne à l'autre).

**Non retenu** :
- Flag « versement PER après 70 ans non déductible » (nouveauté 2026, §3.1) — laissé de côté pour rester à 3 règles ; cas marginal, ajoutable plus tard sans nouvelle donnée (date de naissance + date des Mouvements déjà modélisées).
- Répartition fonds euro vs unités de compte — reste **qualitatif côté LLM**, pas de seuil déterministe : aucune convention chiffrée par bucket de risque suffisamment sourcée n'est apparue dans le recensement fiscal (contrairement aux seuils d'exposition crypto/PE qui seront sourcés par recherche dans [Recherche : limites d'exposition usuelles crypto & private equity par profil de risque](22-recherche-limites-exposition-crypto-pe.md)) ; inventer un seuil ici serait un chiffre arbitraire déguisé en règle.

Décidé par grilling avec l'utilisateur.
