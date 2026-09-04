# Recherche : seuil usuel de liquidités dormantes sur compte courant/livret

Type: research
Status: resolved
Claimed-by: session_01PV2tt8C42uoS1etPeJi5mq
Blocked by: 03

## Question

Pour alimenter [Logique de conseil et anomalies — Liquidités](14-conseil-liquidites.md) : existe-t-il une convention/pratique usuelle (littérature de gestion de patrimoine personnelle, pas de vérité légale) pour déterminer à partir de quel montant/durée du cash non affecté sur un compte courant ou un livret est jugé « dormant » et mériterait d'être investi ailleurs ?

À rechercher :
- Convention usuelle de fonds de précaution / fonds d'urgence (ex. nombre de mois de dépenses courantes recommandé sur un compte courant, avant de considérer le surplus comme dormant).
- Le cas échéant, distinction entre compte courant (réserve de trésorerie immédiate) et livret réglementé (Livret A/LDDS — plafonné, taux connu) : le seuil de « dormance » diffère-t-il selon le support ?
- Sources : littérature de gestion de patrimoine personnelle grand public (pas de recherche académique poussée nécessaire — usage personnel informatif, cf. Notes du [map](../map.md)).

Capturer les sources et chiffres trouvés dans `assets/19-recherche-seuil-liquidites-dormantes.md`, avec le degré de consensus/variabilité entre sources (il n'y a probablement pas un chiffre unique universel).

## Réponse

Recensement complet dans [`assets/19-recherche-seuil-liquidites-dormantes.md`](../assets/19-recherche-seuil-liquidites-dormantes.md) (sources françaises et anglo-saxonnes : MAIF, Boursorama, MoneyVox, Goodvest, Ramify, Fidelity, Ramsey Solutions, NerdWallet, Bankrate, Banque de France, info.gouv.fr).

- **Convention dominante** : fonds de précaution = **3 à 6 mois de dépenses courantes** pour un profil salarié stable, **6 à 12 mois** pour un indépendant/revenu variable (parfois 9-12 mois côté sources anglo-saxonnes). Quasi-unanime entre toutes les sources consultées.
- **Compte courant** : seuil bas distinct, de l'ordre de **1 mois de dépenses + marge de sécurité de 10-20 %** ; au-delà, l'argent ne remplit plus aucune fonction (aucun rendement). Cette marge ne provient que d'une seule source (Goodvest), non recoupée.
- **Livret réglementé (Livret A/LDDS)** : support jugé « idéal » pour loger le fonds de précaution complet. **Aucune source ne fixe de seuil de dormance chiffré spécifique au livret** — le plafond légal du Livret A (22 950 €) est une contrainte de versement, pas un jugement patrimonial de dormance.
- **Incohérence relevée** : la majorité des sources raisonnent en mois de *dépenses*, mais MoneyVox raisonne en mois de *revenus* (seuils plus bas, 2-3 mois) — choix de convention à trancher explicitement en conception.
- **Point annexe hors périmètre** : le taux réel du Livret A est de 1,70 % depuis le 01/08/2026, pas ~3 % comme supposé dans le brief du ticket — à vérifier si ce taux est codé en dur ailleurs dans le domaine Liquidités.

**Recommandation pour [Logique de conseil et anomalies — Liquidités](14-conseil-liquidites.md)**, à valider en grilling (pas tranchée par cette recherche, qui reste AFK) : règle 1 (seuil bas compte courant ≈ 1 mois de dépenses + marge), règle 2 (fonds de précaution livret ≈ 3-6 mois de dépenses), règle 3 optionnelle (au-delà, qualifier de dormant et suggérer diversification). Les seuils numériques exacts (3 vs 6 mois, dépenses vs revenus, marge 10 vs 15-20 %) restent un choix de conception à trancher en session, faute de convention unique.
