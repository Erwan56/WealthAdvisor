# Méthodologie de calcul de l'indépendance financière (FIRE) — recherche sourcée

Ce document rassemble, à partir de sources primaires (étude de Trinity lue intégralement, papier original de Bengen recoupé via plusieurs sources convergentes faute d'accès direct au texte, wiki Bogleheads, papier original Guyton-Klinger) la matière nécessaire pour choisir les formules et multiplicateurs par défaut de la calculette FIRE de l'écran Objectifs. Il complète, sans le refaire, le référentiel fiscal français [`03-regles-fiscales-legales.md`](03-regles-fiscales-legales.md).

---

## 1. La règle du taux de retrait (Safe Withdrawal Rate) — origine, formule, limites

### 1.1 Origine : l'étude de Trinity (1998)

- L'étude **« Retirement Savings: Choosing a Withdrawal Rate That Is Sustainable »**, par Philip L. Cooley, Carl M. Hubbard et Daniel T. Walz, professeurs de finance à Trinity University (San Antonio, Texas) — d'où le surnom « Trinity study » — est parue dans le numéro de février 1998 du *AAII Journal*. Texte intégral lu directement pour cette recherche.
> Source (texte intégral, primaire) : [AAII Journal, février 1998, « Retirement Savings: Choosing a Withdrawal Rate That Is Sustainable »](https://www.aaii.com/journal/199802/feature.pdf)

- **Méthodologie exacte** : les auteurs utilisent les rendements annuels historiques réels du marché américain de 1926 à 1995 (source des données : *Stocks, Bonds, Bills, and Inflation, 1996 Yearbook*, Ibbotson Associates), avec le S&P 500 pour les actions et des obligations d'entreprises long terme *high-grade* pour les obligations. Ils testent :
  - 5 allocations : 100 % actions, 75/25, 50/50, 25/75, 100 % obligations ;
  - 4 horizons de retrait (« payout periods ») : 15, 20, 25, 30 ans ;
  - 10 taux de retrait initiaux : de 3 % à 12 % de la valeur initiale du portefeuille, par pas de 1 point ;
  - sur des périodes glissantes chevauchantes (ex. 41 fenêtres de 30 ans entre 1926 et 1995).
  - Le « taux de succès du portefeuille » (*portfolio success rate*) est le pourcentage de ces fenêtres historiques pour lesquelles le portefeuille n'atteint pas 0 avant la fin de l'horizon.
> Source : idem (AAII Journal, février 1998), tableaux 1 à 4.

- **Point méthodologique important, souvent perdu dans les vulgarisations** : l'étude teste deux variantes de retrait bien distinctes.
  - **Tableau 1** : retrait à **montant nominal constant** (le même montant en dollars chaque année, sans aucun ajustement à l'inflation).
  - **Tableau 3** : retrait **ajusté à l'inflation** chaque année (c'est cette variante qui correspond à la « règle des 4 % » telle que popularisée). Les auteurs notent explicitement que l'ajustement à l'inflation **fait chuter fortement** les taux de succès par rapport au tableau 1, en particulier pour les taux de retrait moyens/élevés.
  - Résultat exact pour un retrait de **4 % ajusté à l'inflation sur 30 ans** (tableau 3) : taux de succès de **95 % (100 % actions)**, **98 % (75/25)**, **95 % (50/50)**, **71 % (25/75)**, **20 % (100 % obligations)** — donc pas littéralement 100 % comme le raccourci populaire le laisse parfois entendre ; le chiffre dépend fortement de l'allocation.
  - Pour un retrait de **3 % ajusté à l'inflation**, le succès est de **100 % sur tous les horizons testés (15 à 30 ans) pour les portefeuilles à dominante actions** (100 %, 75/25, 50/50, et même 25/75 sur 15-20 ans).
> Source : AAII Journal, février 1998, Tableau 3 « Inflation-Adjusted Portfolio Success Rates: 1926 to 1995 ».

- **Conclusions explicites des auteurs** (citations paraphrasées, texte lu intégralement) :
  - Les retraités qui anticipent un horizon long doivent prévoir un taux de retrait plus bas.
  - La présence d'obligations augmente le taux de succès pour les taux de retrait bas à moyens, mais les actions apportent le potentiel de hausse nécessaire aux taux plus élevés ; ils recommandent une allocation d'au moins 50 % en actions pour la plupart des retraités.
  - Les retraits ajustés à l'inflation exigent un taux de retrait initial nettement plus bas que des retraits à montant fixe.
  - **3 % et 4 % sont qualifiés de « comportement exceptionnellement prudent »** (*exceedingly conservative*), susceptibles de laisser un legs important aux héritiers.
  - Pour des horizons courts (≤ 15 ans), 8-9 % apparaît soutenable, mais la plupart des retraités ont un horizon plus long.
  - **Limite explicitement assumée par les auteurs** : « The study did not adjust for taxes or transaction costs. An investor's own experience would differ depending on how much of his assets were in tax-deferred accounts... » — **aucune fiscalité n'est modélisée**, ce qui est directement pertinent pour le contexte français (voir §4).
> Source : idem, section « Conclusion » et méthodologie.

### 1.2 Origine : la « règle des 4 % » de Bengen (1994)

- Citation : Bengen, William P. (1994). **« Determining Withdrawal Rates Using Historical Data »**, *Journal of Financial Planning*, 7(4), 171–180 (paru en octobre 1994).
- **⚠️ Accès à la source primaire non obtenu dans cette recherche** : le PDF hébergé par la Financial Planning Association (`financialplanningassociation.org`) et les autres miroirs identifiés ont renvoyé une erreur 403 lors de cette session. Les éléments ci-dessous proviennent du recoupement de plusieurs sources secondaires convergentes (synthèse de Rob Berger, rétrospective de la Financial Planning Association elle-même publiée en 2023, articles de presse financière citant directement Bengen) — à confirmer par une lecture directe du texte original si une copie devient accessible.
- **Méthodologie rapportée** : Bengen teste un portefeuille simple **50 % grandes capitalisations américaines / 50 % obligations du Trésor américain à moyen terme**, rééquilibré annuellement, sans frais, sur des périodes de retraite glissantes de **30 ans** à partir de chaque année de départ possible depuis 1926.
- **Résultat rapporté (« SAFEMAX »)** : même la pire année de départ historique (1966, à la veille de la stagflation) aurait permis un retrait initial de **4,15 %** de la valeur du portefeuille, réajusté chaque année à l'inflation, sans épuiser le capital sur 30 ans. Le chiffre a été arrondi à la baisse à « 4 % » dans la vulgarisation qui a suivi.
- **Révisions ultérieures par Bengen lui-même** : des travaux de suivi (incluant davantage de classes d'actifs, ex. petites capitalisations) l'ont conduit à relever son propre SAFEMAX, cité à 4,5 % puis plus récemment autour de 4,7-5 %.
> Source (synthèse secondaire) : [Financial Planning Association — « Revisiting William Bengen's 'SAFEMAX' Portfolio Withdrawal Rate »](https://www.financialplanningassociation.org/learning/publications/journal/NOV23-revisiting-william-bengens-safemax-portfolio-withdrawal-rate-OPEN), *Journal of Financial Planning*, novembre 2023.
> Source (synthèse secondaire) : [Rob Berger — « Determining Withdrawal Rates Using Historical Data »](https://robberger.com/research/determining-withdrawal-rates-using-historical-data/).

### 1.3 Formule exacte et multiplicateurs usuels

- La formule est une simple identité algébrique, directement dérivée de la définition du taux de retrait :

  **Capital cible = Dépenses annuelles ÷ Taux de retrait = Dépenses annuelles × Multiplicateur**, avec **Multiplicateur = 1 ÷ Taux de retrait**.

- Multiplicateurs usuels qui en découlent :

  | Taux de retrait | Multiplicateur |
  |---|---|
  | 5 % | 20× |
  | 4,5 % | ≈ 22,2× |
  | 4 % | **25×** |
  | 3,5 % | ≈ **28,6×** |
  | 3 % | ≈ **33,3×** |

- L'usage du terme « **25×** » comme raccourci de la règle des 4 % (issue de Trinity/Bengen) est une convention répandue et bien documentée dans la communauté Bogleheads, qui précise aussi une nuance utile : le multiplicateur ne doit s'appliquer qu'aux dépenses **non couvertes par d'autres revenus** (pension, retraite par répartition, revenus locatifs, etc.) — *« you really only need 25x expenses net of other sources of income »*.
> Source : [Bogleheads — Safe withdrawal rates](https://www.bogleheads.org/wiki/Safe_withdrawal_rates) (page consultée via requêtes de recherche indexées — la lecture directe de la page a été bloquée par un CAPTCHA/403 pendant cette session, voir « Incertitudes » en fin de document) ; fil de discussion [Bogleheads — « 25 times expenses and 4% rule based on age »](https://www.bogleheads.org/forum/viewtopic.php?t=454720).

### 1.4 Limites connues du SWR / de la règle des 4 %

1. **Risque de séquence de rendements (sequence-of-returns risk)** : l'ordre dans lequel les rendements surviennent compte autant que leur moyenne. Un mauvais rendement en tout début de retraite, combiné à des retraits, entame le capital de façon permanente (les parts vendues en baisse ne profitent plus du rebond ultérieur), alors que le même mauvais rendement en fin de période fait beaucoup moins de dégâts. Ce risque est la raison technique pour laquelle une moyenne historique de rendement ne suffit pas à garantir un taux de retrait, et pour laquelle Trinity/Bengen raisonnent en « pire cas historique » plutôt qu'en moyenne.
> Source (synthèse secondaire, référence reconnue du domaine — recherches de Michael Kitces et Wade Pfau) : [Kitces.com — « Understanding Sequence Of Return Risk »](https://www.kitces.com/blog/understanding-sequence-of-return-risk-safe-withdrawal-rates-bear-market-crashes-and-bad-decades/).
2. **Base historique 100 % marché américain** : Trinity (S&P 500 + obligations d'entreprises US, 1926-1995) et Bengen (grandes capitalisations US + Treasuries US) ne testent que des rendements du marché américain. Aucune des deux études ne modélise un portefeuille français/européen (PEA, SCPI, immobilier locatif, etc.), ni des rendements hors marché US.
3. **Retraits fixes vs variables** : le tableau 1 de Trinity (montant nominal fixe, non ajusté à l'inflation) donne des taux de succès très différents du tableau 3 (ajusté à l'inflation) — c'est ce dernier qui correspond à la « règle des 4 % » telle que popularisée. Confondre les deux variantes fausse l'interprétation des chiffres de succès.
4. **Aucune fiscalité ni frais de transaction modélisés** — limite explicitement assumée dans le texte de Trinity (cf. §1.1), directement pertinente pour l'adaptation au contexte fiscal français (§4).
5. **Hypothèses d'allocation du portefeuille** : les taux cités supposent une allocation actions/obligations diversifiée (au moins 50 % actions recommandé par Trinity) rééquilibrée régulièrement ; un patrimoine concentré (immobilier locatif direct, crypto-actifs, private equity peu liquide) n'est pas représenté par ces études.
6. **Durée testée = horizon fini, pas perpétuité** : ni Trinity ni Bengen ne prétendent qu'un retrait à 4 % dure indéfiniment. Trinity teste des horizons fixes de 15/20/25/30 ans ; Bengen définit son SAFEMAX pour « au moins 30 ans ». Pour un horizon FIRE nettement plus long (40-60 ans, typique d'une retraite anticipée à 35-45 ans), ni l'une ni l'autre étude ne fournit de garantie testée directement — c'est un point d'extrapolation, pas un résultat direct des études (voir §2.2 et « Incertitudes »).
7. **Périodes glissantes non indépendantes** : les fenêtres de 30 ans se chevauchent largement (ex. 41 fenêtres sur 70 ans de données), ce qui limite la portée statistique du « taux de succès » — une critique reprise dans la littérature académique ultérieure (Scott et al. 2008 qualifient l'approche d'« inefficace économiquement » ; Kotlikoff la juge déconnectée de la théorie économique).
> Source (synthèse secondaire de ces critiques académiques) : [Wikipedia — Trinity study](https://en.wikipedia.org/wiki/Trinity_study) (page utilisée uniquement comme index vers les critiques citées, pas comme source primaire des chiffres).

---

## 2. Méthodes alternatives / complémentaires couramment citées

### 2.1 Dépenses actuelles constatées × multiplicateur

- Formule identique à celle du §1.3, mais la donnée d'entrée n'est pas une **dépense annuelle cible en retraite** estimée séparément, mais le **niveau de vie actuel réellement observé** (ex. moyenne des dépenses des 12 derniers mois issue du suivi budgétaire de l'app).
- Avantage : donnée directement disponible dans WealthAdvisor sans étape de projection supplémentaire.
- Limite documentée par la communauté FIRE : les dépenses évoluent souvent significativement à la retraite (disparition de frais professionnels/transport, fin de remboursement de prêt immobilier, hausse possible des dépenses de santé/loisirs, disparition des enfants à charge, etc.), donc « dépenses actuelles » et « dépenses cibles en indépendance financière » peuvent diverger fortement pour un même foyer.

### 2.2 Multiplicateurs plus prudents (28-33×) pour horizons longs

- Les communautés FIRE francophones (ex. liberte-fi.com, mustachianpost.com) citent couramment un multiplicateur de **28 à 33×** (soit un taux de retrait de 3 à 3,5 %) plutôt que 25×, au motif que Trinity/Bengen n'ont testé la tenue du capital que jusqu'à **30 ans**, alors qu'un profil FIRE partant tôt (35-45 ans) a un horizon de 40 à 60 ans.
- **Ce point est à traiter comme une extrapolation communautaire, pas comme un résultat d'une étude académique indépendante testant spécifiquement des horizons > 30 ans** : aucune source primaire équivalente à Trinity/Bengen mais testant 40-60 ans n'a été identifiée dans cette recherche.
> Source (secondaire, communauté FIRE francophone, non retenue comme source primaire mais citée pour documenter l'usage) : [Liberté-FI — « Nombre FIRE : calculer son objectif avec la règle des 25x »](https://liberte-fi.com/articles/nombre-fire-regle-25x-calculer-objectif/).
- Le fil Bogleheads évoqué en §1.3 propose une règle de pouce cohérente avec cette logique : environ **25× à 65 ans, 33× à 55 ans** (le multiplicateur augmente à mesure que l'horizon de retrait s'allonge).
> Source : [Bogleheads — « 25 times expenses and 4% rule based on age »](https://www.bogleheads.org/forum/viewtopic.php?t=454720).

### 2.3 Stratégies de retrait variable

**a) Guyton-Klinger (« garde-fous » / guardrails)**

- Papier original : Guyton, Jonathan T. et Klinger, William J. (2006). **« Decision Rules and Maximum Initial Withdrawal Rates »**, *Journal of Financial Planning*, mars 2006.
- Quatre règles combinées : règle de la source de retrait (piocher dans la classe d'actifs la plus performante de l'année), règle d'inflation (ne pas augmenter le retrait à l'inflation l'année suivant un rendement négatif), règle de préservation du capital / *garde-fou bas* (si le taux de retrait courant dépasse 120 % du taux initial, réduire le retrait suivant de 10 %), règle de prospérité / *garde-fou haut* (si le taux de retrait courant descend sous 80 % du taux initial, augmenter le retrait suivant de 10 %).
- Résultat rapporté : avec les quatre règles actives, un portefeuille équilibré (60-65 % actions) supporterait un taux de retrait initial d'environ **5 à 5,6 %** sur 40 ans avec un niveau de confiance historique comparable ou meilleur qu'un taux fixe de 4 %, au prix d'un revenu annuel variable.
- **Donnée d'entrée attendue** : contrairement au SWR statique, cette méthode ne répond pas directement à « combien de capital me faut-il ? » — elle prend en entrée un capital de départ **déjà constitué** et le suit année après année (valeur de portefeuille courante), pour ajuster le montant du retrait en cours de retraite. Utile en phase de décaissement, moins directement utile pour fixer un objectif de capital cible en amont.
> Source (synthèse secondaire du papier original, texte intégral du JFP 2006 non consulté directement dans cette session) : recoupement de plusieurs synthèses convergentes (White Coat Investor, fils Bogleheads dédiés).
> Source (fil Bogleheads dédié) : [Bogleheads — « Guyton-Klinger Withdrawal Decision Rules »](https://www.bogleheads.org/forum/viewtopic.php?t=160073).

**b) VPW (Variable Percentage Withdrawal) — Bogleheads**

- Méthode développée collectivement par la communauté Bogleheads : chaque année, le retrait = pourcentage (croissant avec l'âge, jusqu'à un plafond de 10 %) × **valeur courante du portefeuille**, et non un montant cible fixé à l'avance.
- Combine les logiques des méthodes « dollar constant », « pourcentage constant » et « 1/N ». Par construction, ne peut jamais épuiser prématurément le portefeuille (le retrait est toujours une fraction du solde restant), mais le montant retiré varie chaque année avec le marché **et** le capital tend vers 0 en fin d'horizon choisi (pas de garantie de legs).
- **Donnée d'entrée attendue** : valeur de portefeuille courante + horizon de décaissement choisi (ou espérance de vie), **pas** une dépense cible fixe en euros.
> Source : [Bogleheads — Variable percentage withdrawal](https://www.bogleheads.org/wiki/Variable_percentage_withdrawal) (idem §1.3, lecture directe bloquée pendant cette session, contenu reconstitué via recherche indexée).

---

## 3. Ce que ces méthodes permettent concrètement d'évaluer comme « réalisable »

- La formule **Capital cible = Dépenses × Multiplicateur** (§1.3) donne un **nombre unique et comparable au patrimoine net actuel** : c'est ce qui permet à une calculette de répondre à « suis-je proche de l'indépendance financière ? » en comparant patrimoine net actuel / capital cible (pourcentage d'avancement), sans modéliser explicitement les rendements futurs année par année — c'est tout l'intérêt pédagogique du multiplicateur par rapport à une simulation Monte-Carlo complète.
- Ce nombre peut ensuite alimenter une projection classique d'horizon (« dans combien d'années j'atteins ce capital, compte tenu de mon taux d'épargne et d'un rendement attendu ») — un calcul d'accumulation standard, indépendant de Trinity/Bengen eux-mêmes (ces études ne portent que sur la phase de décaissement, pas sur la phase d'accumulation).
- **Le choix du multiplicateur change matériellement le verdict "réalisable"** : passer de 25× à 33× relève la barre de +32 %. Ce choix dépend d'au moins trois facteurs identifiés dans la recherche, qui justifient de le garder éditable dans l'UI plutôt que figé :
  1. **L'horizon de décaissement visé** — un profil FIRE avec un horizon de 40-60 ans devrait, par extrapolation communautaire (§2.2) et non par résultat direct de Trinity/Bengen (testés jusqu'à 30 ans), utiliser un multiplicateur plus élevé (28-33×) qu'un profil partant à l'âge de la retraite légale avec un horizon plus court (25× peut suffire).
  2. **Les autres revenus attendus à terme** (pension de retraite, revenus locatifs déjà détenus, rente PER) réduisent le montant de « dépenses non couvertes » à multiplier — cf. la nuance Bogleheads « 25x expenses **net of other income sources** » (§1.3).
  3. **La tolérance au risque / volonté de legs** — Trinity qualifie 3-4 % de choix « exceptionnellement prudent », avec un legs résiduel attendu élevé dans la majorité des scénarios historiques (Tableau 4 : valeur terminale médiane souvent 2 à 9× la mise de départ) ; un utilisateur davantage tolérant au risque de tout dépenser pourrait légitimement choisir un multiplicateur plus bas.
- Aucune des méthodes de retrait variable (§2.3) ne fournit directement un « capital cible » comparable au patrimoine actuel de la même façon que le SWR statique — elles supposent un capital déjà là et pilotent le décaissement. Pour l'écran Objectifs (qui doit chiffrer un objectif à atteindre), le SWR statique (§1) reste donc la méthode la plus directement exploitable comme formule de calculette ; les méthodes variables (Guyton-Klinger, VPW) sont plus pertinentes pour un futur écran de pilotage du décaissement une fois l'indépendance atteinte — distinction à noter pour le ticket de prototypage.

---

## 4. Considérations fiscales françaises pertinentes pour le cadrage de la calculette

*Rappel : le recensement fiscal détaillé est dans [`03-regles-fiscales-legales.md`](03-regles-fiscales-legales.md) ; cette section ne fait que noter comment ces règles devraient influencer le **cadrage** (inputs/outputs) de la calculette FIRE, sans re-chiffrer les taux.*

- Trinity et Bengen ne modélisent **aucune fiscalité** (limite explicitement assumée par Trinity, §1.1). Le taux de retrait de 4 % (ou tout multiplicateur qui en dérive) est donc un taux **brut** appliqué à un capital, sans présumer de ce qui reste réellement disponible à la dépense une fois l'impôt et les prélèvements sociaux payés sur ce retrait.
- En France, le taux d'imposition effectif d'un retrait dépend fortement de **l'enveloppe** dont il est issu (cf. `03-regles-fiscales-legales.md`) :
  - **PEA après 5 ans** : gains totalement exonérés d'IR, seuls les prélèvements sociaux (17,2 % historiquement / 18,6 % en 2026, sur la seule part de gains) restent dus — §1.4 du référentiel fiscal.
  - **CTO** : PFU de 31,4 % (12,8 % IR + 18,6 % PS) sur la totalité de la plus-value de cession — §1.5.
  - **Assurance-vie ≥ 8 ans** : seule la **quote-part « produits » (gains)** du rachat est taxée (au prorata capital/gains du contrat), avec un abattement annuel de 4 600 €/9 200 € et un taux réduit à 7,5 % sous le seuil de 150 000 € de versements — §2.1 à §2.3. Le **capital versé** n'est jamais taxé au rachat, contrairement à un retrait « brut » assimilé par Trinity/Bengen à un simple pourcentage de portefeuille.
  - **PER** : à la sortie, si les versements ont été déduits à l'entrée, le capital est réintégré au barème progressif de l'IR — un traitement bien plus proche d'un revenu imposable classique que d'un simple retrait de plus-value — §3.5.
- **Conséquence pour le cadrage de la calculette** : un même « multiplicateur × dépenses » appliqué uniformément, sans distinction d'enveloppe, mélange en réalité des retraits à taux d'imposition effectifs très différents (proche de 0 % net de PS pour du PEA ancien, jusqu'à un taux marginal d'IR plein pour du PER en phase de sortie). Deux options de cadrage se dégagent de cette recherche, à trancher dans le ticket de prototypage :
  1. Traiter le résultat de la calculette comme un **capital cible brut** (avant impôt), en indiquant explicitement à l'utilisateur qu'il devra prévoir une marge supplémentaire selon la composition réelle de son patrimoine par enveloppe — cadrage le plus fidèle aux études sources, le plus simple à implémenter, mais qui laisse l'écart fiscal non résolu à la charge de l'utilisateur.
  2. Exposer un **paramètre éditable de « ponction fiscale effective »** (ex. un pourcentage appliqué au multiplicateur ou aux dépenses cibles) que l'utilisateur ajuste selon sa composition patrimoniale réelle — plus fidèle à la réalité française, mais suppose que la calculette (ou le modèle de patrimoine sous-jacent) sache déjà répartir le patrimoine par enveloppe, ce qui dépasse le périmètre de cette recherche.
- Point notable et spécifique à la France, sans équivalent direct dans les études sources : la fiscalité de l'assurance-vie et du PER dépend de **seuils de durée du contrat / âge** (8 ans pour l'assurance-vie, franchissement de seuils divers pour le PER) — ce qui signifie que la capacité de retrait « net » d'un même patrimoine peut **s'améliorer mécaniquement dans le temps**, indépendamment des rendements de marché, simplement en franchissant ces seuils. C'est un effet que ni Trinity ni Bengen ne capturent et qui pourrait justifier, à terme, un ajustement du multiplicateur ou de la fiscalité effective en fonction de l'ancienneté des contrats détenus — noté ici comme piste, non résolu.

---

## Incertitudes ouvertes / points nécessitant un arbitrage humain

1. **Texte intégral du papier original de Bengen (1994) non consulté directement** : toutes les tentatives d'accès (archive FPA, ProQuest, miroirs tiers) ont échoué (403) pendant cette session. Les chiffres rapportés (4,15 % SAFEMAX, portefeuille 50/50, révisions à 4,5-5 %) proviennent de sources secondaires convergentes mais n'ont pas été vérifiés mot pour mot contre le texte de Bengen lui-même.
2. **Wiki Bogleheads (« Safe withdrawal rates » et « Variable percentage withdrawal ») non lu directement** : le fetch direct de ces pages a été bloqué (403 / CAPTCHA) pendant cette session ; le contenu rapporté provient de synthèses de résultats de recherche indexés, pas d'une lecture intégrale de la page. Recommandé : un contrôle humain rapide de ces deux pages avant intégration ferme dans une spec.
3. **Aucune étude académique primaire équivalente à Trinity/Bengen mais testant des horizons de 40-60 ans (typiques d'un profil FIRE) n'a été identifiée.** Le multiplicateur « prudent » de 28-33× cité par la communauté FIRE francophone est une extrapolation, pas un résultat direct d'un backtest sur ces horizons — à traiter comme un choix de politique produit (valeur par défaut éditable), pas comme un fait établi.
4. **Aucune étude académique primaire testant des rendements de marché français/européens (par opposition au marché américain de Trinity/Bengen) n'a été trouvée.** L'écart entre un « 4 % » calibré sur le S&P 500 1926-1995 et un portefeuille français réel (PEA d'actions européennes, SCPI, immobilier locatif direct) n'est pas quantifié par les sources consultées.
5. **Articulation précise entre le cadrage « brut vs net de fiscalité » (§4) et le modèle de patrimoine existant de WealthAdvisor** non tranchée ici : dépend de la capacité du modèle de patrimoine à distinguer les enveloppes (PEA/CTO/assurance-vie/PER) au moment du calcul de l'objectif — question à trancher dans le ticket de prototypage [12-prototype-calculette-fire.md](../issues/12-prototype-calculette-fire.md) (si ce ticket existe déjà) plutôt qu'ici.
6. **Papier original Guyton-Klinger (JFP, mars 2006) non consulté en texte intégral** : les quatre règles et le chiffre de 5-5,6 % de taux de retrait initial proviennent de synthèses secondaires convergentes (dont des fils Bogleheads dédiés), pas d'une lecture directe du PDF du *Journal of Financial Planning*.
