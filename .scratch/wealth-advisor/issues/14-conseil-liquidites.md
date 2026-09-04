# Logique de conseil et anomalies — Liquidités

Type: grilling
Status: resolved
Claimed-by: session_01XoLJJEihPVwiZUVYQx1TvJ
Blocked by: 01, 03, 04, 19

## Question

Suite au ticket [Conception du moteur de conseil hybride](04-moteur-conseil-hybride.md) (déclenchement proactif d'anomalies simples déjà acté, ex. « liquidités dormantes ») et à la sous-question déjà traitée séparément dans [Réserve de précaution immobilier et arbitrage liquidités ↔ investissement](13-reserve-precaution-immobilier.md) (comptes liés à un bien via `réserve_pour` — **exclue de ce ticket**), définir la logique de conseil déterministe propre au domaine Liquidités pour le cas générique (comptes non liés à un `réserve_pour`) :

- Seuil de « liquidités dormantes » générique (ex. montant/durée au-delà duquel du cash non affecté est jugé excessif) — cible un socle minimal, 2 à 4 règles maximum (cf. [Conception du moteur de conseil hybride](04-moteur-conseil-hybride.md), principe « rester simple »).
- Origine du seuil : formule/convention usuelle à sourcer (ex. montant recommandé sur un compte courant, nombre de mois de dépenses comme fonds d'urgence) si une convention établie existe, sinon jugement personnel tranché en grilling.
- Éventuelles autres anomalies/angles de conseil propres aux liquidités au-delà du seuil dormant (à explorer en session).

**Cadrage déjà tranché (à ne pas rouvrir)** : socle minimal (pas un moteur exhaustif) ; le LLM ne recalcule jamais un chiffre, il reçoit les résultats déterministes déjà calculés et les habille en recommandation qualitative ; le compte lié à un bien immobilier via `réserve_pour` est hors périmètre de ce ticket.

## Réponse

Socle retenu : **2 règles**, portant uniquement sur les comptes **personnels** (les comptes courants professionnels sont explicitement exclus, voir plus bas).

**Amendement au modèle** préalable, nécessaire pour rendre ces règles calculables :
- Ajout du champ **Dépenses mensuelles courantes** au Profil (saisie directe par l'utilisateur, même pattern que la TMI/le Plafond PER annuel — pas de calcul dérivé). Convention retenue : mois de *dépenses*, pas de revenus (majorité des sources de [Recherche : seuil usuel de liquidités dormantes sur compte courant/livret](19-recherche-seuil-liquidites-dormantes.md), MoneyVox raisonnant seul en revenus).
- Ajout du champ **Mois de réserve visés** au Profil (paramètre éditable, valeur par défaut 6 mois — milieu de la fourchette usuelle salarié 3-6 mois). Même pattern que la cible de réserve immobilière ajustable par bien ([Réserve de précaution immobilier et arbitrage liquidités ↔ investissement](13-reserve-precaution-immobilier.md)) : pas de champ « statut professionnel » séparé pour moduler automatiquement 3-6 vs 6-12 mois, l'utilisateur ajuste directement s'il se sait dans une situation différente d'un salarié stable.
- Ajout des champs **Banque** et **Perso/Pro** (structurés) sur la Ligne liquidités, en plus du libellé déjà existant — nécessaire pour distinguer et filtrer les comptes courants personnels (3) des comptes courants professionnels (2) révélés en session, et pour permettre le filtrage perso/pro qu'exigent les règles ci-dessous.

**Règle A — Compte courant dormant** : évaluée **par compte courant personnel individuel** (pas de granularité agrégée — chaque compte a sa propre raison d'être, agréger masquerait un compte surchargé compensé par un autre sous-alimenté). Seuil : 1 mois de Dépenses mensuelles courantes + marge de sécurité de **15 %** (milieu de la fourchette 10-20 % de la source unique disponible). Au-delà → anomalie « compte courant dormant », suggestion de transférer le surplus vers un livret ou une Enveloppe existante du patrimoine.

**Règle B — Fonds de précaution livret** : évaluée sur le **total agrégé de tous les livrets personnels** (cohérent avec la vision consolidée déjà retenue pour le moteur de conseil — pas d'objectif par support, l'utilisateur pouvant volontairement répartir entre plusieurs livrets pour des raisons de plafond). Cible : Mois de réserve visés (Profil, défaut 6) × Dépenses mensuelles courantes. Au-delà → anomalie « liquidités dormantes », suggestion d'investir le surplus ailleurs (Enveloppe existante du patrimoine).

**Comptes professionnels — exclus de ces 2 règles** : la trésorerie professionnelle répond à une logique différente (provisions TVA/URSSAF, faible risque mais paramètres propres à l'activité indépendante) qui n'est pas capturée par la recherche disponible, laquelle ne couvre que les particuliers. Reporté au nouveau ticket [Recherche : seuil usuel de trésorerie de précaution pour un compte professionnel indépendant](24-recherche-precaution-compte-pro.md), cadré sur l'activité réelle de l'utilisateur (IT indépendant, faible risque, faibles charges engagées). Une éventuelle 3e règle « trésorerie pro dormante » pourra être ajoutée au socle (toujours dans le budget 2-4 déjà cadré) une fois cette recherche disponible — pas tranchée dans ce ticket.

Décidé par grilling avec l'utilisateur ; la distinction perso/pro des comptes courants et le besoin d'un champ Banque ont émergé en session (l'utilisateur a 3 comptes courants perso et 2 comptes courants pro liés à une activité indépendante).
