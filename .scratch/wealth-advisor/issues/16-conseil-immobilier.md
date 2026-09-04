# Logique de conseil et anomalies — Immobilier

Type: grilling
Status: resolved
Claimed-by: session_01KyTR9vL4DycQpCRNm89HNd
Blocked by: 01, 03, 04, 21

## Question

Suite au ticket [Conception du moteur de conseil hybride](04-moteur-conseil-hybride.md), définir la logique de conseil déterministe propre au domaine Immobilier — **hors sujet de la réserve de précaution et de l'arbitrage liquidités ↔ investissement**, déjà traité dans [Réserve de précaution immobilier et arbitrage liquidités ↔ investissement](13-reserve-precaution-immobilier.md) :

- Calcul du rendement locatif et du cash-flow (formule exacte : brut, net de charges, net-net après impôt/prêt ?) à partir des champs déjà modélisés (loyer, charges, taxe foncière, assurance, frais de gestion, mensualité — voir [Modèle de données du patrimoine par domaine](01-modele-patrimoine.md)).
- Logique de recommandation « vendre/garder » un bien : quels indicateurs déterministes alimentent cette question, et jusqu'où va le rôle du LLM dans l'arbitrage ?
- Anomalies proactives propres à l'immobilier (ex. rendement anormalement bas, capital restant dû proche du seuil de rachat anticipé...) — à explorer en session.

**Cadrage déjà tranché (à ne pas rouvrir)** : socle minimal, 2 à 4 règles/angles maximum ; formules usuelles sourcées si convention établie existe, seuils tranchés en jugement personnel sinon ; le LLM ne recalcule jamais un chiffre ; la réserve de précaution par bien et le surplus investissable ne sont pas traités ici.

## Réponse

Socle retenu : **3 règles/angles** (dans la limite 2-4 déjà cadrée).

1. **Rentabilité anormale** — s'applique uniquement aux Lignes immobilier louées (régime de location actif, loyer renseigné non nul). Signalement proactif si **rendement net de charges < 3 %** (jugement personnel, aucune convention chiffrée sourcée pour un seuil de rendement "bas" — contrairement aux formules de rendement elles-mêmes, cf. [Recherche : conventions de calcul du rendement locatif et du cash-flow](21-recherche-rendement-locatif-conventions.md)) et/ou **cash-flow < 0 €** (fait objectif, pas de seuil à choisir). Les deux faits sont indépendants et se combinent dans un même message s'ils sont vrais tous les deux.

2. **Prêt bientôt soldé → déclencheur de l'angle vendre/garder** — alerte proactive **6 mois avant** l'échéance estimée de fin de prêt (calculée à partir du capital restant dû et de la mensualité courants, mêmes champs que le calcul de cash-flow), même pattern que l'alerte des 8 ans en assurance-vie ([Logique de conseil et anomalies — Assurance-vie/PER](17-conseil-assurance-vie-per.md)). Ce n'est pas une simple notification : elle sert de point d'entrée pour transmettre en contexte au LLM les indicateurs de l'angle vendre/garder (rendement net et cash-flow courants, cash-flow projeté une fois le prêt soldé, plus-value latente — valeur estimée moins prix d'acquisition total — **uniquement si le bien n'est pas résidence principale**, exonérée sans condition de durée, cf. [Règles fiscales et légales françaises par domaine](03-regles-fiscales-legales.md) §4.4 —, et ancienneté de détention pour se situer par rapport aux abattements pour durée de détention sur la plus-value, exonération IR à 22 ans / PS à 30 ans). L'angle vendre/garder reste **aussi disponible à la demande** à tout moment, avec ou sans prêt en cours — ce n'est jamais une décision automatique, seulement un contexte pour l'arbitrage qualitatif du LLM, dans le même esprit que l'angle fiscal PEA/CTO de la bourse.

3. **Proximité du seuil IFI** — calculé sur le total immobilier net cumulé (valeur estimée − capital restant dû par Ligne, résidence principale abattue de 30 % avant sommation), comparé au seuil de 1 300 000 € ([Règles fiscales et légales françaises par domaine](03-regles-fiscales-legales.md) §4.5). Restitué avec un **indicateur de confiance explicite** (comme les 11 points fiscaux incertains déjà actés au moteur hybride) : ce calcul simplifié ignore l'usufruit, les biens professionnels exonérés, les autres dettes déductibles, et les parts de SCPI (domaine Private equity/autres) qui compteraient aussi dans l'assiette IFI réelle.

**Convention actée en passant** (point resté ouvert au ticket [Recherche : conventions de calcul du rendement locatif et du cash-flow](21-recherche-rendement-locatif-conventions.md)) : le champ « prix d'acquisition total » inclut les frais de notaire et les travaux initiaux, pas seulement le prix d'achat nu — c'est la seule des 5 sources qui tranche explicitement, et c'est plus cohérent avec le rendement réel perçu par l'utilisateur.

**Point d'implémentation noté (hors périmètre de ce ticket)** : rendement brut, rendement net de charges et cash-flow affichés directement sur la Ligne immobilier dans le tableau de bord (champs dérivés à l'affichage, pas de nouveau champ stocké), pas seulement transmis en contexte au chat — à traiter dans [UX des formulaires de saisie par domaine](06-ux-formulaires-saisie.md).

Décidé par grilling avec l'utilisateur.

## Amendement (voir [Modélisation multi-entités juridiques / sociétés](28-modelisation-multi-entites-juridiques.md))

Le calcul du seuil IFI (règle 3) s'agrège désormais sur le total immobilier net de **toutes les Entités confondues** (perso + SCI de détention immobilière), pas seulement le patrimoine personnel — cohérent avec la vision consolidée par défaut désormais actée au niveau Entité. Aucune logique d'exclusion « biens professionnels » propre à l'IFI n'est ajoutée ; l'indicateur de confiance déjà prévu pour ce calcul couvre cette approximation supplémentaire.
