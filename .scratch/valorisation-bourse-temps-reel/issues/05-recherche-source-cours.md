# Recherche : source de cours gratuite par ISIN, couverture EUR + conversion devise étrangère

Type: research
Status: resolved
Claimed-by: session_013yZgqVv9UEGzjsxyB8dDE8

## Question

Identifier une (ou plusieurs, en fallback) source de cours boursiers gratuite, interrogeable par ISIN, adaptée à un refresh à la demande (pas de polling continu) pour des titres PEA/PEA-PME/CTO (majoritairement Euronext, mais un CTO peut détenir des valeurs étrangères non-EUR).

Contraintes déjà actées (cf. [Contraintes pour la source de cours externe](04-contraintes-source-cours.md)) :
- Gratuite uniquement, pas de budget pour un abonnement payant.
- Doit accepter une recherche par ISIN (pas seulement par ticker/symbole propriétaire à la source), ou fournir un moyen fiable de résoudre un ISIN vers l'identifiant que la source utilise.
- Doit couvrir au minimum les valeurs cotées en euros (Euronext Paris et assimilés) — c'est le cas d'usage principal (PEA notamment, qui impose des titres éligibles européens).
- Doit permettre, pour les valeurs cotées en devise étrangère (typiquement CTO), soit de renvoyer directement un cours converti en EUR, soit de fournir un taux de change exploitable séparément pour convertir côté application au moment du refresh.
- Usage strictement personnel, faible volume d'appels (quelques dizaines de titres max, refresh déclenché manuellement, pas plus de quelques fois par jour) — pas besoin de temps réel infra-journalier.

À rechercher et documenter dans `assets/05-recherche-source-cours.md` :
1. Candidats sérieux (ex. API publiques boursières gratuites acceptant une recherche par ISIN — evaluer notamment ce qui est réellement gratuit sans carte bancaire, avec quelles limites de quota/rate-limit, quelle fiabilité/disponibilité, et quelle couverture réelle des ISIN Euronext PEA/CTO courants).
2. Pour chaque candidat retenu : format de requête (ISIN → endpoint), forme de la réponse (prix, devise de cotation, présence ou non d'un taux de change ou d'un endpoint de change séparé), fraîcheur des données (temps réel/différé/fin de journée — préciser le délai si différé), quota gratuit exact (requêtes/jour ou /minute), et toute contrainte d'usage (clé API requise ou non, conditions d'utilisation compatibles avec un usage personnel non commercial).
3. Une source de change (EUR/devise) séparée si le candidat retenu pour les cours ne fournit pas de conversion native — même critère de gratuité.
4. Recommandation motivée : source principale + fallback si la première échoue ou ne couvre pas un ISIN donné, avec le niveau de confiance sur la couverture réelle des valeurs typiquement détenues en PEA/CTO (ETF Amundi/Lyxor, actions du CAC 40/SBF 120, actions étrangères courantes).

Cette recherche alimente directement [Modèle de données — ISIN, coût d'acquisition, contrat de l'endpoint refresh](06-modele-donnees-refresh.md) (le contrat exact de l'endpoint refresh dépend de la forme de réponse de la source choisie).

## Réponse

Recherche détaillée (13 candidats testés en direct par `curl`, formats de requête/réponse, quotas, CGU, niveaux de confiance) : [assets/05-recherche-source-cours.md](../assets/05-recherche-source-cours.md).

**Recommandation : source principale = endpoints JSON non officiels de Yahoo Finance**, testés en direct le 09/09/2026 :
- Résolution ISIN → titre : `GET https://query{1,2}.finance.yahoo.com/v1/finance/search?q={ISIN}` (gratuit, sans clé) — confirmé fonctionnel sur LVMH (`FR0000121014` → `MC.PA`).
- Cours + devise de cotation : `GET https://query1.finance.yahoo.com/v8/finance/chart/{symbol}` (le endpoint `v7/finance/quote`, plus ancien, renvoie désormais `401 Unauthorized`) — testé sur Euronext Paris (LVMH, EUR) et un titre US (AAPL, USD), cours croisé avec succès contre Boursorama à la même heure.
- **Source de change séparée retenue : Frankfurter (`api.frankfurter.dev`/`.app`)**, taux de référence BCE, gratuite, sans clé, sans quota documenté — préférée à `exchangerate-api.com` (clé requise, 1500/mois).

Points de vigilance actés :
- Ces endpoints Yahoo sont **non officiels** (API officielle fermée depuis 2017) : les CGU Yahoo interdisent explicitement toute collecte automatisée sans autorisation préalable ; zone grise tolérée en pratique (usage massif par des libs open-source comme `yfinance`) mais sans garantie contractuelle, aucun quota documenté, panne possible sans préavis (déjà observé sur `v7/finance/quote`). Le refresh doit échouer proprement titre par titre plutôt que supposer une disponibilité garantie (cohérent avec le principe déjà acté au [ticket #04](04-contraintes-source-cours.md) : un ISIN non résolu n'est pas bloquant).
- **Fallback retenu pour la résolution ISIN→ticker uniquement** (pas pour le cours) : OpenFIGI (gratuit, sans clé obligatoire, 25 req/min, CGU explicitement permissives) et/ou Twelve Data `symbol_search` (gratuit, sans clé) pour confirmer/normaliser un ticker. **Pas de fallback gratuit fiable identifié pour le cours lui-même** en cas de panne Yahoo : Twelve Data exige une clé pour le cours et ne couvre Euronext Paris gratuitement que de façon non confirmée (le plan gratuit semble limité aux US) ; les autres candidats testés sont écartés (Alpha Vantage 25/j, marketstack 100/mois, EODHD 20/j — tous trop restrictifs ; stooq bloqué par anti-bot ; Boursorama techniquement faisable mais CGU interdisant *nommément* la collecte automatisée avec menace de poursuite explicite ; Euronext officiel payant uniquement ; IEX Cloud fermé depuis fin 2024). À défaut, dépannage manuel ponctuel par l'utilisateur (consultation web, pas d'automatisation).
- Niveau de confiance : **haute** sur la résolution ISIN→ticker Euronext Paris et sur le cours Yahoo lui-même pour les blue chips CAC 40/SBF 120 (testé en direct sur LVMH, cross-vérifié Boursorama) et pour les valeurs étrangères courantes (US) ; **faible à moyenne** sur la pérennité à long terme des endpoints Yahoo non officiels — c'est le point de fragilité principal de cette recommandation. Non vérifié spécifiquement : ETF Amundi/Lyxor et petites capitalisations SBF 120/PEA-PME (extrapolation raisonnable depuis le cas LVMH, mais pas testé nommément), quotas réels de Financial Modeling Prep (page pricing bloquée par anti-bot) et de Finnhub (site SPA illisible statiquement).
