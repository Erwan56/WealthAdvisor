# Recherche : source de cours de bourse pour le rafraîchissement manuel

Date de la recherche : 2026-09-09.

## Question de recherche

Identifier une ou plusieurs sources de données boursières **gratuites, sans budget**, interrogeables par **ISIN** (ou permettant une résolution ISIN → identifiant propriétaire fiable), adaptées au besoin suivant : un bouton « rafraîchir » manuel unique sur le dashboard Bourse de WealthAdvisor, déclenché à la demande (pas de polling continu, pas de job planifié — quelques clics par jour tout au plus), qui va chercher le cours courant de chaque Ligne ayant un ISIN renseigné et l'enregistre en EUR (avec conversion de devise si besoin). Volume : usage personnel, probablement moins de 100 ISIN distincts, quelques rafraîchissements par jour maximum.

Méthode : consultation des pages officielles (documentation API, pricing, CGU/ToS) de chaque fournisseur, complétée par des **appels HTTP réels via `curl`** depuis le sandbox (accès Internet disponible et vérifié) chaque fois que possible, pour observer le comportement effectif plutôt que de se fier à des résumés tiers. Les résultats de recherche web n'ont servi qu'à localiser les pages officielles à vérifier ensuite.

---

## 1. OpenFIGI (Bloomberg) — résolution ISIN → identifiant, pas de cours

**Rôle réel :** OpenFIGI ne fournit **pas de cours**. C'est un service de *mapping* d'identifiants (ISIN/CUSIP/SEDOL → FIGI, ticker, place de cotation). Utile uniquement comme étape de résolution ISIN → ticker pour une autre source.

**Test en direct** (sans clé API), pour l'ISIN LVMH `FR0000121014` :

```
curl -X POST "https://api.openfigi.com/v3/mapping" \
  -H "Content-Type: application/json" \
  -d '[{"idType":"ID_ISIN","idValue":"FR0000121014"}]'
```

Réponse réelle obtenue (extrait) :
```json
[{"data":[{"figi":"BBG000BC7Q05","name":"LVMH MOET HENNESSY LOUIS VUI","ticker":"MC","exchCode":"FP", ...}, {"...":"...","exchCode":"GR"}, ...]}]
```
→ Renvoie une liste multi-place (une entrée par bourse où le titre est coté : `FP` = Euronext Paris avec ticker `MC`, plus Francfort, Berlin, Stuttgart, Vienne, etc.). Il faut donc filtrer sur le bon `exchCode` pour PEA/CTO (Euronext Paris = `FP`).

- **Accepte l'ISIN directement** : oui, en entrée de `POST /v3/mapping` — [documentation officielle](https://www.openfigi.com/api/documentation).
- **Fraîcheur des données** : sans objet (pas de cours, juste du référentiel).
- **Quota gratuit exact**, d'après la [doc officielle](https://www.openfigi.com/api/documentation) : **sans clé API, 25 requêtes/minute, 10 identifiants par requête** ; **avec clé API gratuite, 25 requêtes/6 secondes, 100 identifiants par requête**.
- **Clé API** : optionnelle, gratuite, obtenue par simple inscription ([openfigi.com/user/signup](https://www.openfigi.com/user/signup)) ; le service revendique être « free to use without daily, weekly or monthly limitations » ([openfigi.com/api](https://www.openfigi.com/api)).
- **CGU** : les [conditions d'utilisation](https://www.openfigi.com/docs/terms-of-service) autorisent explicitement l'usage, la reproduction et la redistribution des identifiants FIGI, y compris à des tiers, sans restriction commerciale/non‑commerciale : *« you are free, on a non‑exclusive basis, to use, display, reproduce, distribute and create derivative works from the FIGI Identifiers … including redistribution of the FIGI Identifiers to your customers »*. Compatible avec un usage personnel.

**Conclusion** : bon candidat pour l'étape « résoudre ISIN → ticker Euronext Paris », gratuit et sans clé, mais **ne remplace pas** une source de cours.

---

## 2. Yahoo Finance (endpoints non officiels)

Aucune documentation officielle publique (l'ancienne API officielle a été fermée par Yahoo en 2017). Deux endpoints non documentés mais publics ont été testés en direct.

**Résolution ISIN → ticker**, endpoint de recherche `query2.finance.yahoo.com/v1/finance/search` :
```
curl -A "Mozilla/5.0" "https://query2.finance.yahoo.com/v1/finance/search?q=FR0000121014"
```
Réponse réelle (extrait) :
```json
{"quotes":[{"exchange":"PAR","shortname":"LVMH","quoteType":"EQUITY","symbol":"MC.PA","exchDisp":"Paris", ...}], "count":9, ...}
```
→ Résout directement l'ISIN vers le ticker Yahoo `MC.PA`, sans clé.

**Cours**, endpoint `v8/finance/chart` (fonctionne, contrairement à `v7/finance/quote` qui renvoie désormais `Unauthorized` — testé en direct, voir ci-dessous) :
```
curl -A "Mozilla/5.0" "https://query1.finance.yahoo.com/v8/finance/chart/MC.PA"
```
Réponse réelle (extrait du champ `meta`) :
```json
"meta":{"currency":"EUR","symbol":"MC.PA","exchangeName":"PAR","regularMarketPrice":411.25,
"regularMarketTime":1788968375,"previousClose":426.55, ...}
```
Même test sur un titre américain (`AAPL`, cas CTO) :
```json
{"symbol":"AAPL","currency":"USD","regularMarketPrice":312.43,"exchangeName":"NMS"}
```
→ Le champ `currency` est renvoyé nativement, ce qui permettrait la conversion.

Test de l'ancien endpoint `v7/finance/quote` (aujourd'hui cassé) :
```
curl -A "Mozilla/5.0" "https://query1.finance.yahoo.com/v7/finance/quote?symbols=MC.PA"
→ {"finance":{"result":null,"error":{"code":"Unauthorized","description":"... https://bit.ly/yahoo-finance-api-feedback"}}}
```

- **Accepte l'ISIN** : indirectement, via l'endpoint de recherche non officiel (fonctionne en pratique, testé ci-dessus).
- **Fraîcheur** : temps réel/quasi temps réel en heures de bourse pour `v8/finance/chart` (le test ci-dessus montre un prix coïncidant avec Boursorama à la même heure, voir section 6).
- **Quota** : **aucun quota officiel documenté** puisqu'il n'existe pas de documentation officielle — usage à ses risques, Yahoo peut bloquer une IP ou imposer un CAPTCHA sans préavis.
- **Clé API** : aucune requise pour ces endpoints non officiels.
- **CGU** : les [conditions d'utilisation Yahoo](https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html) interdisent explicitement la collecte automatisée : *« [must not] access or collect data … from our Services using any automated means, devices, programs, algorithms or methodologies, including but not limited to robots, spiders, scrapers, data mining tools … for any purpose without our express, prior permission »* (section 2.4.i). Il n'existe donc **aucune autorisation explicite** pour un usage automatisé, même personnel et à faible fréquence — c'est une zone grise tolérée en pratique par la communauté (nombreuses libs open-source l'utilisent), mais non couverte contractuellement.

**Conclusion** : techniquement excellent (ISIN→ticker et cours EUR/USD en un aller-retour, sans clé, données fraîches, couverture mondiale y compris Euronext Paris et actions US), mais **ToS non conforme à la lettre** pour un accès automatisé. Risque pratique faible vu le volume (quelques requêtes/jour) mais à documenter comme tel.

---

## 3. stooq.com

Testé en direct :
```
curl "https://stooq.com/q/l/?s=aapl.us&f=sd2t2ohlcv&h&e=csv"
```
Résultat réel : **404 / page de challenge JavaScript anti-bot** (`This site requires JavaScript to verify your browser…`, calcul de preuve de travail SHA-256 côté client). Confirmé également avec l'ancien format documenté historiquement (`q/l/?s=...`) et une variante `q/d/l/`.

- **Constat** : stooq.com a mis en place une protection anti-bot (challenge JS/PoW) qui **bloque désormais l'accès par simple `curl`/script serveur**, contrairement à ce que documentent de nombreux tutoriels tiers datant d'avant ce changement. Impossible de confirmer un format d'URL CSV qui fonctionne encore sans exécuter du JavaScript.
- Pas de documentation officielle d'API trouvée (le site n'expose qu'une interface web).
- **Conclusion** : écarté pour ce projet — non exploitable de façon fiable depuis un serveur/script sans navigateur headless, ce qui est disproportionné pour ce besoin.

---

## 4. Alpha Vantage

Testé en direct avec la clé de démonstration publique `demo` :
```
curl "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=demo"
→ {"Global Quote":{"01. symbol":"IBM","05. price":"232.0900","07. latest trading day":"2026-09-08", ...}}
```
Tentative sur un titre Euronext Paris :
```
curl "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=MC.PAR&apikey=demo"
→ {"Information":"The **demo** API key is for demo purposes only. Please claim your free API key ..."}
```
→ La clé démo ne couvre que quelques symboles US précâblés ; impossible de vérifier avec elle la couverture Euronext.

- **Accepte l'ISIN** : non directement — Alpha Vantage attend un *symbol* (ticker), pas de service de résolution ISIN documenté.
- **Quota gratuit exact**, source [page premium officielle](https://www.alphavantage.co/premium/) : **25 requêtes par jour** (« For use cases that exceed our standard API usage limit (25 API requests per day)… »). C'est très restrictif — même à quelques clics par jour, ce budget est vite consommé si plusieurs dizaines d'ISIN doivent être rafraîchis en une seule opération de type « refresh global ».
- **Clé API** : gratuite, inscription simple sur leur site.
- **Couverture Euronext Paris** : non vérifiable en direct (clé démo insuffisante) ; la doc générale d'Alpha Vantage met surtout en avant les marchés US, avec un support international plus limité/moins documenté.
- **CGU** : usage non commercial généralement toléré sur le tier gratuit, mais non vérifié en détail ici faute de page ToS dédiée trouvée.

**Conclusion** : écarté comme source principale — quota de 25 requêtes/jour totalement inadapté à un portefeuille de ~100 ISIN, même rafraîchi rarement.

---

## 5. Twelve Data

**Résolution ISIN → symbole**, endpoint `symbol_search`, testé en direct **sans clé API** :
```
curl "https://api.twelvedata.com/symbol_search?symbol=FR0000121014"
```
Réponse réelle (extrait) :
```json
{"data":[{"symbol":"MC","instrument_name":"LVMH Moët Hennessy Louis Vuitton SE","exchange":"Euronext","mic_code":"XPAR","country":"France","currency":"EUR"}, {"symbol":"MOH","exchange":"XETR", "country":"Germany", ...}, ...]}
```
→ Fonctionne effectivement sans clé et résout bien l'ISIN vers le ticker Euronext Paris.

**Cours**, testé en direct sans clé :
```
curl "https://api.twelvedata.com/price?symbol=MC&exchange=XPAR"
→ {"code":401,"message":"**apikey** parameter is incorrect or not specified. You can get your free API key instantly following this link: https://twelvedata.com/pricing", "status":"error"}
```
→ Une clé est obligatoire pour obtenir un cours (contrairement à la recherche de symbole).

- **Quota gratuit exact**, [page pricing officielle](https://twelvedata.com/pricing) : plan Basic gratuit = **800 requêtes/jour** (« 8 API credits, 800 a day »), pas de limite par minute clairement indiquée sur cette page.
- **Couverture Euronext Paris sur le plan gratuit** : d'après la page produit et les pages [Euronext Paris](https://twelvedata.com/exchanges/XPAR) de Twelve Data, **le plan gratuit ne couvre que les données US** ; les bourses internationales (dont Euronext Paris) ne sont accessibles qu'en « trial » ou sur plans payants. Autrement dit : la résolution ISIN→ticker fonctionne gratuitement, mais **le cours réel pour un titre Euronext Paris nécessite probablement un plan payant**, information à confirmer avec une vraie clé gratuite (non testée ici faute d'inscription).
- **Clé API** : gratuite, inscription requise pour tout accès aux cours.

**Conclusion** : intéressant comme **résolveur ISIN→ticker gratuit sans clé** (le seul testé qui marche sans aucune authentification), mais couverture des cours Euronext Paris en gratuit non garantie — nécessiterait un test avec une vraie clé gratuite pour trancher, non réalisé ici.

---

## 6. Financial Modeling Prep (FMP)

Documentation officielle sur l'ISIN confirmée : FMP publie une **« ISIN API »** dédiée (`search-isin`), documentée ici : [site.financialmodelingprep.com/developer/docs/stable/search-isin](https://site.financialmodelingprep.com/developer/docs/stable/search-isin) (page chargée en direct, titre confirmé : « ISIN API », description : « Retrieve ISINs and financial details like company name, stock symbol, and market cap globally »).

Test en direct de l'endpoint sans clé :
```
curl "https://financialmodelingprep.com/stable/search-isin?isin=FR0000121014"
→ {"Error Message":"Invalid API KEY. Feel free to create a Free API Key or visit ..."}
```
→ Confirme que la fonctionnalité existe mais nécessite une clé (impossible de tester le contenu réel de la réponse ISIN sans inscription).

- **Accepte l'ISIN** : oui, nativement, via cet endpoint dédié.
- **Quota gratuit** : la page de pricing officielle (`site.financialmodelingprep.com/developer/docs/pricing`) a renvoyé un **403 Forbidden** à chaque tentative (WebFetch et curl avec plusieurs User-Agent) — probablement une protection anti-bot. **Non vérifié en direct.** Des pages secondaires du site FMP lui-même, retrouvées via recherche (donc non consultées directement mais dont le contenu est attribué à FMP), indiquent un plan gratuit à **250 requêtes/jour**, sans engagement de durée. Cette information n'a **pas pu être confirmée directement sur la page officielle** à cause du blocage 403 — à considérer comme non vérifié avec certitude.
- **Couverture internationale sur le plan gratuit** : non vérifiée (le plan gratuit de FMP est historiquement plus limité sur les marchés hors US, mais je n'ai pas pu le confirmer sur la page officielle bloquée).
- **Clé API** : gratuite, inscription requise.

**Conclusion** : source à endpoint ISIN natif intéressante sur le papier, mais quota et couverture Euronext non vérifiables avec certitude ici (page pricing bloquée par anti-bot).

---

## 7. EOD Historical Data (EODHD)

Testé en direct avec la clé de démonstration publique `demo` :
```
curl "https://eodhd.com/api/real-time/AAPL.US?api_token=demo&fmt=json"
→ {"code":"AAPL.US","close":313.02,"change_p":-1.012, ...}
```
→ Fonctionne pour le symbole de démo `AAPL.US` uniquement.
```
curl "https://eodhd.com/api/exchange-symbol-list/PA?api_token=demo&fmt=json"
→ "Forbidden"
```
→ La clé démo ne donne pas accès à la liste des tickers Euronext Paris (limitation propre à la clé `demo`, pas nécessairement au plan gratuit réel).

- **Accepte l'ISIN** : pas de recherche directe par ISIN identifiée dans la documentation consultée ; EODHD fonctionne par ticker + suffixe de place (`.PA` pour Euronext Paris, confirmé par leur page [liste des bourses supportées](https://eodhd.com/financial-apis/list-supported-exchanges) et par la fiche produit [ENX.PA](https://eodhd.com/financial-summary/ENX.PA)).
- **Quota gratuit exact**, [page pricing officielle](https://eodhd.com/pricing) : **20 appels API par jour** (« Once you have registered, you will be granted 20 free API calls per day »).
- **Couverture Euronext Paris** : confirmée dans la doc EODHD (code bourse `PA`, MIC `XPAR`), mais la répartition exacte de ce qui est inclus dans le plan **gratuit** (vs. le plan payant à partir de 19,99 €/mois « EOD Historical Data — All World ») n'est pas détaillée sur la page de pricing elle-même — à vérifier après inscription réelle.
- **Clé API** : gratuite à l'inscription.

**Conclusion** : quota de 20 requêtes/jour trop faible pour rafraîchir ~100 ISIN en une fois ; pourrait convenir en usage très parcimonieux (quelques lignes à la fois) mais pas comme source principale pour un refresh global.

---

## 8. Finnhub

Le site (finnhub.io) est une application JavaScript côté client (SPA) ; les tentatives de récupération du contenu de la page `/pricing` via `curl`/`WebFetch` n'ont renvoyé que le squelette HTML sans les chiffres de quota (rendu fait par JavaScript, non exécuté par nos outils). **Je n'ai donc pas pu vérifier en direct le quota exact du plan gratuit de Finnhub** ni sa couverture des bourses non américaines — seule certitude obtenue depuis le site officiel : Finnhub se positionne comme « Free APIs for realtime stock, forex, and cryptocurrency » ([finnhub.io](https://finnhub.io/)), sans détail chiffré accessible dans le contenu statique.

**Conclusion** : candidat non écarté mais **non substantié par une source primaire consultable ici** — à revérifier manuellement (inscription + lecture du dashboard, ou documentation PDF/API) avant de l'utiliser.

---

## 9. polygon.io — rebrandé en Massive

Constat inattendu : `https://polygon.io/pricing` redirige désormais (301) vers **`https://massive.com/pricing`** (vérifié en direct via WebFetch, en-tête `Location` du serveur). Le nom « polygon.io » semble avoir été remplacé par « Massive » pour l'offre grand public/API de données de marché.

Contenu de la page de pricing Massive (`massive.com/pricing`), consultée en direct :
- **Stocks Basic — 0 $/mois** : **5 appels API/minute**, données **fin de journée (End of Day)** uniquement.
- Stocks Starter (29 $/mois) / Developer (79 $/mois) : illimité, données différées de 15 minutes.
- Stocks Advanced (199 $/mois) : illimité, temps réel.

- **Accepte l'ISIN** : non vérifié (pas testé faute de clé), la marque ayant changé il n'est pas certain que la documentation d'origine polygon.io (endpoints `/v3/reference/tickers` avec recherche) soit encore d'actualité sous ce nom.
- **Quota gratuit exact** : 5 requêtes/minute, données EOD seulement (pas de temps réel), confirmé sur la page officielle.
- **Couverture** : essentiellement marchés US historiquement pour polygon.io ; couverture Euronext Paris non confirmée pour le plan gratuit.

**Conclusion** : quota techniquement suffisant en fréquence (5/min), mais gratuité et couverture Euronext non garanties après ce rebranding — à retester avant adoption, changement trop récent/incertain pour s'appuyer dessus avec confiance.

---

## 10. marketstack

- **Quota gratuit** : **100 requêtes/mois** (« 100 Requests / mo »), confirmé sur la page produit officielle ([marketstack.com/product](https://marketstack.com/product)).
- **Type de données sur le plan gratuit** : fin de journée uniquement (« End-of-Day Data »), pas de temps réel (réservé aux plans payants).
- **Historique** : limité à 1 an sur le plan gratuit.
- **ISIN** : je n'ai pas trouvé, dans la documentation consultée, de paramètre `isin` explicite sur l'endpoint `tickers` — seulement des recherches par `symbols`/`exchange`. Non confirmé avec certitude.

**Conclusion** : écarté — 100 requêtes/mois est trop faible même pour un usage « quelques fois par jour » avec ~100 ISIN (un seul refresh complet du portefeuille consommerait déjà la totalité du quota mensuel).

---

## 11. IEX Cloud — fermé

**Confirmé sur la source primaire elle-même** : le site officiel [iexcloud.org](https://iexcloud.org/) affiche désormais uniquement le message *« IEX Cloud has retired »* (balises `og:title`, `og:site_name`, titres de page — vérifié en direct par `curl`). Selon les informations relayées (dont [le dépôt d'archive GitHub api-evangelist/iex-cloud](https://github.com/api-evangelist/iex-cloud)), IEX Group a annoncé l'arrêt le 31 mai 2024 pour un arrêt effectif le 31 août 2024 ; tous les endpoints sont aujourd'hui injoignables.

**Conclusion** : écarté, service définitivement fermé.

---

## 12. Boursorama (pages publiques, scraping non officiel)

**Test technique** : la page produit fonctionne et contient bien le cours en clair dans le HTML servi (pas de rendu JS nécessaire pour la donnée elle-même) :
```
curl -A "Mozilla/5.0" "https://www.boursorama.com/cours/1rPMC/"
```
Extrait trouvé dans le HTML : `data-ist-last>411,25` (variation `-3,59%`). Cette valeur **coïncide exactement** avec le cours obtenu au même moment via Yahoo Finance (`411.25`, `-3.587%`) — bonne confirmation croisée de fraîcheur/exactitude.

Reste à résoudre : l'identifiant interne Boursorama (`1rPMC`) n'est pas l'ISIN — une étape de résolution ISIN → symbole Boursorama serait nécessaire (aucun endpoint de recherche public propre trouvé qui accepte un ISIN directement ; `www.boursorama.com/recherche/FR0000121014` renvoie une 404).

**CGU — point bloquant.** Les mentions légales officielles de Boursorama (page [boursorama.com/aide/avertissement-legal](https://boursorama.com/aide/avertissement-legal), consultée en direct), section « Informations propriétaires », interdisent explicitement :
- la redistribution/mise en réseau de l'information : *« Any networking, any redistribution, in any form, even partial, is therefore prohibited »* ;
- la collecte automatisée : *« It is forbidden to use any means of automatic data retrieval (computer program) to collect Information »* ;
- avec une menace de poursuite explicite : *« Any attempted automatic data recovery will immediately result in filing a complaint »*.

**Conclusion** : **écarté malgré la faisabilité technique.** Boursorama est la seule source de cette liste dont les CGU interdisent *nommément et sans ambiguïté* la récupération automatisée de données, avec mention explicite de poursuites. Même à très faible fréquence (quelques requêtes/jour) et pour un usage strictement personnel, ce n'est pas un risque à prendre pour ce projet.

---

## 13. Euronext (source officielle du marché)

Consultation de la page officielle [euronext.com/en/data/market-data](https://www.euronext.com/en/data/market-data) : Euronext ne documente **aucune API publique gratuite en libre accès**. Le site oriente vers :
- Live Markets ([live.euronext.com](https://live.euronext.com)) pour une consultation web (cours différés), sans API documentée pour de l'extraction automatisée ;
- des contacts commerciaux (`databyeuronext@euronext.com`, `datasolutions@euronext.com`) pour tout accès programmatique aux données de marché, real-time ou historiques, via abonnement payant.

**Conclusion** : écarté — pas d'offre API gratuite exploitable pour ce projet ; Euronext monétise ses données de marché comme n'importe quelle bourse.

---

## Récapitulatif des sources de cours

| Source | ISIN direct ? | Quota gratuit (source officielle) | Couverture Euronext Paris confirmée | Clé requise | Verdict |
|---|---|---|---|---|---|
| OpenFIGI | Oui (mapping seulement, pas de cours) | 25/min sans clé, 25/6s avec clé | — (référentiel seulement) | Non (optionnelle) | Résolveur ISIN→ticker, pas une source de cours |
| Yahoo Finance (non officiel) | Oui, via `/v1/finance/search` | Aucun quota documenté (pas d'API officielle) | Oui, testé en direct | Non | **Candidat principal**, ToS non conforme à la lettre |
| stooq.com | — | — | — | — | Écarté : bloqué par anti-bot JS |
| Alpha Vantage | Non | 25/jour | Non vérifié | Oui | Écarté : quota trop faible |
| Twelve Data | Oui (recherche gratuite, testée) | 800/jour (cours) | Non pour le cours en gratuit (US only, testé sans clé le prouve indirectement) | Oui pour le cours | Bon résolveur ISIN, cours gratuit incertain hors US |
| Financial Modeling Prep | Oui (endpoint dédié) | Non vérifié (page bloquée 403) | Non vérifié | Oui | Non tranché faute d'accès à la page officielle |
| EODHD | Non (ticker+suffixe) | 20/jour | Oui (référentiel), plan gratuit non détaillé | Oui | Quota trop faible pour un refresh global |
| Finnhub | Non vérifié | Non vérifié (site SPA, non lisible statiquement) | Non vérifié | Oui | Non substantié |
| polygon.io / Massive | Non vérifié | 5/min, EOD seulement, plan à 0 $ confirmé | Non vérifié | Oui | Rebranding récent, incertitude trop grande |
| marketstack | Non confirmé | 100/mois | Non vérifié | Oui | Écarté : quota mensuel trop faible |
| IEX Cloud | — | — | — | — | Écarté : fermé depuis le 31/08/2024 |
| Boursorama (scraping) | Non (id interne) | Techniquement illimité | Oui, testé en direct | Non | Écarté : CGU interdisent explicitement |
| Euronext officiel | — | Pas d'offre gratuite | — | — | Écarté : payant uniquement |

---

## Conversion de devises (EUR ↔ devises étrangères)

### Frankfurter (frankfurter.dev / api.frankfurter.app)

Testé en direct, sans clé :
```
curl "https://api.frankfurter.app/latest?from=EUR&to=USD"
→ {"amount":1.0,"base":"EUR","date":"2026-09-09","rates":{"USD":1.1652}}

curl "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD,GBP,CHF"
→ {"amount":1.0,"base":"EUR","date":"2026-09-09","rates":{"CHF":0.9404,"GBP":0.85898,"USD":1.1652}}
```
Et pour forcer explicitement la source BCE (paramètre `providers`) :
```
curl "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD&providers=ECB"
→ {"amount":1.0,"base":"EUR","date":"2026-09-09","rates":{"USD":1.1652}}
```
(même valeur que sans filtre — cohérent avec le fait que l'EUR est la devise de référence de la BCE).

- **Source des données** : projet open-source qui agrège désormais **94 banques centrales** ; le paramètre `providers=ECB` permet de restreindre explicitement aux taux de référence officiels de la Banque centrale européenne quand la conformité l'exige ([frankfurter.dev/docs](https://frankfurter.dev/docs)). Historiquement, et pour la paire EUR, la BCE reste la source pertinente (« Because the European Central Bank, our original data source, is in Frankfurt » — page d'accueil du projet).
- **Quota** : **aucune limite documentée** pour l'instance publique — *« There are no quotas. Requests are rate-limited to prevent abuse, but there are no monthly or daily caps »* ([frankfurter.dev](https://frankfurter.dev/)).
- **Clé API** : **aucune requise**.
- **Fraîcheur** : taux de référence quotidiens (publication BCE en semaine, généralement vers 16h CET — non revérifié à l'heure près ici, mais cohérent avec la pratique connue de la BCE).
- **CGU/usage commercial** : explicitement autorisé — *« Yes, absolutely. See each provider's terms for details on the underlying data »* (FAQ du projet).

### ECB Statistical Data Warehouse / flux SDMX (source ultime)

Frankfurter n'est qu'un habillage REST simple au-dessus des données de la BCE ; la source première reste le [SDW de la BCE](https://data.ecb.europa.eu/) et son [service SDMX](https://data.ecb.europa.eu/help/api/overview). Non testé en direct ici (le format SDMX/XML est nettement plus lourd à intégrer qu'un simple JSON REST pour un besoin aussi simple), mais c'est l'option de repli « source ultime, zéro intermédiaire » si Frankfurter devenait indisponible.

### exchangerate-api.com

- **Quota gratuit** : **1 500 requêtes/mois**, d'après la [documentation officielle](https://www.exchangerate-api.com/docs/free).
- **Clé API** : requise dès le plan gratuit (inscription).
- Moins généreux et plus contraignant (clé obligatoire) que Frankfurter pour un besoin de quelques conversions par jour.

**Conclusion conversion de devises** : **Frankfurter** est nettement préférable — pas de clé, pas de quota pratique, taux BCE vérifiables explicitement, testé en direct et fonctionnel.

---

## Recommandation

### Source de cours

- **Principal : Yahoo Finance (endpoints non officiels `v1/finance/search` + `v8/finance/chart`).**
  Raisons : c'est la seule option testée en direct qui (a) résout un ISIN vers un ticker exploitable sans clé ni inscription, (b) renvoie un cours avec devise native pour des titres Euronext Paris *et* des actions américaines dans le même format, (c) n'impose aucun quota chiffré qui contraindrait un usage de quelques dizaines de requêtes, quelques fois par jour. Le cours obtenu au moment du test coïncidait avec celui de Boursorama à la même heure, ce qui est un bon indice de fiabilité pratique.
  **Réserve explicite** : ce n'est pas une API officiellement supportée par Yahoo, et les CGU Yahoo interdisent à la lettre toute collecte automatisée sans autorisation préalable. Le risque concret pour un usage personnel à très faible fréquence (quelques clics par jour, moins de 100 ISIN) est faible en pratique — c'est l'approche que la quasi-totalité des bibliothèques open-source grand public (yfinance et équivalents) utilisent depuis des années — mais ce n'est pas une garantie contractuelle, et Yahoo pourrait bloquer l'accès sans préavis.

- **Secours (fallback) : OpenFIGI pour la résolution ISIN→ticker (si besoin de confirmer/normaliser un ticker) + Twelve Data `symbol_search` (gratuit, sans clé, testé) comme second résolveur** ; puis, si un cours effectif est nécessaire en repli et que Yahoo est indisponible, **Twelve Data avec une clé gratuite** pour les valeurs *couvertes en gratuit* (essentiellement US — donc utile surtout pour les lignes CTO américaines), sachant que la couverture Euronext Paris en gratuit n'est pas garantie (voir section 5). À défaut, une bascule manuelle temporaire vers la consultation web de Boursorama (sans automatisation, pour ne pas violer ses CGU) reste toujours possible en dépannage ponctuel par l'utilisateur lui-même.

  Je n'ai **pas** retenu Alpha Vantage (25/jour, trop faible), marketstack (100/mois, trop faible), EODHD (20/jour, trop faible), stooq (bloqué par anti-bot), Boursorama en automatique (CGU l'interdisent explicitement), Euronext officiel (payant), IEX Cloud (fermé), ni polygon.io/Massive et Finnhub (couverture et statut du plan gratuit non vérifiables avec assez de certitude ici).

### Conversion de devises

- **Frankfurter** (`api.frankfurter.app` / `api.frankfurter.dev`), sans clé, sans quota documenté, avec option `providers=ECB` pour figer explicitement la source sur les taux de référence BCE si une justification de conformité est un jour nécessaire.

### Niveau de confiance

- **Résolution ISIN → ticker pour les valeurs Euronext Paris typiques d'un PEA/PEA-PME** (CAC 40, SBF 120, ETF Amundi/Lyxor) : **confiance élevée**. Testé en direct sur LVMH (CAC 40) avec succès simultané sur OpenFIGI, Yahoo et Twelve Data ; ces trois services reposent sur des référentiels de place larges et bien peuplés pour les valeurs françaises importantes. Non testé spécifiquement sur un ETF Amundi/Lyxor ni sur une petite capitalisation SBF 120 — extrapolation raisonnable mais **pas vérifiée nommément**.
- **Cours effectif Yahoo pour Euronext Paris et actions US (CTO)** : **confiance élevée** — testé en direct sur les deux cas, cohérence croisée avec Boursorama pour le cas Paris.
- **Pérennité de l'accès Yahoo non officiel** : **confiance faible à moyenne** — c'est le point de fragilité principal de la recommandation ; un changement côté Yahoo (comme celui déjà observé sur `v7/finance/quote`, désormais cassé) pourrait casser `v8/finance/chart` sans préavis.
- **Ce qui n'a pas pu être vérifié** :
  - le quota gratuit réel de Financial Modeling Prep (page pricing bloquée par anti-bot, 403 persistant malgré plusieurs User-Agents) ;
  - le quota et la couverture réels de Finnhub (site en SPA JavaScript, contenu non extractible statiquement par les outils utilisés ici) ;
  - le statut exact et la couverture internationale du plan gratuit de polygon.io/Massive après son rebranding très récent ;
  - la couverture précise d'Euronext Paris sur le plan gratuit réel de Twelve Data et d'EODHD (testé seulement en mode « recherche » sans clé, ou en mode démo limité à un unique ticker US) ;
  - l'heure exacte de publication quotidienne des taux BCE relayés par Frankfurter (non revérifiée à la minute près) ;
  - toute évolution des CGU Yahoo/Boursorama postérieure à cette recherche (2026-09-09).
