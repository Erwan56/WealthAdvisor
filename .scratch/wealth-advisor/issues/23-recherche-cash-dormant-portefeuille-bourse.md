# Recherche : rationale et seuil usuel du cash dormant en portefeuille bourse

Type: research
Status: resolved
Claimed-by: session_01KyTR9vL4DycQpCRNm89HNd
Blocked by: 03

## Question

Pour alimenter [Logique de conseil et anomalies — Bourse](15-conseil-bourse.md) : existe-t-il une convention/pratique usuelle en gestion de patrimoine personnelle sur la part de cash non investi qu'il est raisonnable de garder au sein d'un portefeuille actions (poche « compte espèces » d'un PEA/PEA-PME/CTO), par opposition à investir ce cash dans un support diversifié à faible volatilité (ex. un ETF indiciel large type MSCI World) ?

Cas d'usage de référence donné par l'utilisateur : PEA de 280k€, dont 180k€ investis en titres et 100k€ en cash non investi — l'utilisateur demande pourquoi garder du cash dormant plutôt que de l'investir sur un indice large (par exemple pour amortir un krach en revendant un indice diversifié, plutôt qu'une ligne ou un secteur isolé), et s'il existe une convention chiffrée pour ce seuil.

À rechercher :
- Rationale usuelle pour garder une poche de cash non investie au sein d'un portefeuille actions (ex. réserve tactique pour saisir des opportunités/krachs, lissage d'entrée en position (DCA), tolérance au risque à court terme) — distincte du fonds de précaution/urgence générique déjà traité dans [Recherche : seuil usuel de liquidités dormantes sur compte courant/livret](19-recherche-seuil-liquidites-dormantes.md), qui porte sur les liquidités hors enveloppe bourse.
- Fourchette usuelle de cash « acceptable » au sein d'un portefeuille actions avant d'être jugé dormant (ex. % de la valeur de l'enveloppe), si une telle convention existe dans la littérature de gestion de patrimoine personnelle grand public.
- Le cas échéant, ce que dit cette littérature sur l'alternative proposée par l'utilisateur (tout investir sur un indice large diversifié à faible volatilité relative, plutôt que garder du cash, au motif qu'un krach affecterait moins un indice large qu'une ligne/secteur isolé) — arguments pour/contre, sans trancher lequel est "juste" (c'est un choix de conception, pas une vérité).
- Sources : littérature de gestion de patrimoine personnelle grand public (pas de recherche académique poussée nécessaire — usage personnel informatif, cf. Notes du [map](../map.md)).

Capturer les fourchettes, rationales et sources dans `assets/23-recherche-cash-dormant-portefeuille-bourse.md`, avec le degré de consensus/variabilité entre sources.

## Réponse

Recensement complet dans [`assets/23-recherche-cash-dormant-portefeuille-bourse.md`](../assets/23-recherche-cash-dormant-portefeuille-bourse.md) (sources françaises et anglo-saxonnes : MoneyVox, Goodvest, Café de la Bourse, e-investing, finref.fr, Bogleheads, White Coat Investor, Vanguard, arbolyo.fr, twentysixpatrimoine.com, edgepointwealth.com).

- **Rationales identifiées** (distinctes du fonds d'urgence hors PEA, cf. ticket 19) : réserve tactique/« dry powder » pour saisir les creux, lissage (DCA) d'un apport important, cash technique transitoire (ventes/dividendes en attente, rebalancement), réserve de court terme pour un besoin de retrait proche (risque de séquence de rendement), et motif psychologique/comportemental (confort, réduction du risque de vente paniquée).
- **Seuil chiffré** : **aucune convention reconnue et recoupée n'existe**, contrairement au fonds d'urgence (3-6 mois de dépenses, quasi unanime). Les repères trouvés sont dispersés et non consensuels : pratiques individuelles de 0 à 30 % citées sur un forum MoneyVox (sans consensus, plusieurs contributeurs jugeant qu'un seuil fixe « n'a aucun sens ») ; 2-4 % de cash « technique » et un plafond isolé de 10 % (attribué à W. Bengen) côté Bogleheads, non recoupés par d'autres sources ; 10-15 % ou un « seau » de 5 ans de dépenses évoqués spécifiquement pour un profil proche de la retraite (risque de séquence de rendement), hors champ du cas de référence (PEA en accumulation).
- **Alternative de l'utilisateur (tout investir sur un indice large type MSCI World)** : bien documentée des deux côtés, sans arbitrage tranché par la littérature.
  - Pour : cash drag mesurable et documenté (étude Vanguard : investissement immédiat surperforme le lissage dans 67-68 % des cas, +2,3 %/an en moyenne sur un portefeuille 100 % actions ; backtest White Coat Investor/Bogleheads montrant qu'une stratégie de réserve tactique déployée sur les creux sous-performe l'investissement intégral) ; diversification qui élimine le risque spécifique à une valeur/un secteur (contrairement au risque de marché global, qui lui subsiste).
  - Contre/nuances : un MSCI World reste exposé au risque de marché global et a historiquement chuté fortement en cas de krach (~-55 % en 2008, ~-30/-35 % en 2020, ~-12/-20 % en 2022 selon la devise/source) ; risque de séquence de rendement si un retrait est nécessaire pendant une baisse ; frictions de liquidité (délai de règlement-livraison) ; tolérance psychologique au risque de vente paniquée (l'étude Vanguard elle-même relève un écart de probabilité de capitulation entre investisseurs 100 % investis et investisseurs ayant lissé leurs apports).
- **Consensus/variabilité** : fort consensus sur l'existence du cash drag et sur l'absence de convention chiffrée pour le seuil de cash en portefeuille bourse ; divergence non résolue entre le courant indiciel passif (Bogleheads/Vanguard/White Coat Investor, plutôt défavorable au cash tactique) et une partie de la presse patrimoniale généraliste française (plutôt favorable à une réserve pour saisir les creux, sans chiffrer le coût d'opportunité).

Cette recherche ne tranche **pas** entre « fixer un seuil de cash dormant en portefeuille bourse » et « recommander l'investissement intégral sur un indice diversifié » : c'est un choix de conception laissé à la session de grilling [Logique de conseil et anomalies — Bourse](15-conseil-bourse.md), que cette recherche alimente.
