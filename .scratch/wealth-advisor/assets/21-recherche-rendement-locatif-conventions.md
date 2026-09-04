# Rendement locatif et cash-flow — conventions usuelles (recherche sourcée)

Ce document rassemble les formules **usuelles** (conventions grand public de la presse patrimoniale et des sites d'investissement locatif français, pas de définition réglementaire officielle) pour calculer le rendement brut, le rendement net de charges et le cash-flow d'un investissement locatif. Il alimente la conception d'un moteur de calcul **déterministe** (non-IA) qui affichera ces indicateurs à l'utilisateur final, à partir des champs déjà décidés pour une « Ligne immobilier » (prix d'acquisition total, loyer, charges, taxe foncière, assurance, frais de gestion, mensualité de prêt — historisés par valorisation).

**Conclusion en une phrase, développée ci-dessous** : le rendement brut et le rendement net de charges font l'objet d'un **consensus solide sur la structure générale** de la formule entre toutes les sources consultées, mais avec des **divergences fines et non tranchées** sur deux points précis — (1) le loyer est-il pris charges comprises ou hors charges récupérables, et (2) le dénominateur inclut-il les frais de notaire/travaux ou seulement le prix d'achat nu. Le cash-flow fait l'objet d'un consensus net sur une présentation « à trois étages » (brut → net → net-net), l'étage « net-net » (après impôt) n'ayant en revanche aucune convention de calcul simple et partagée — cohérent avec la décision antérieure du projet d'écarter la fiscalité immobilière fine.

---

## 1. Rendement brut

### 1.1 Formule et consensus de structure

Toutes les sources consultées s'accordent sur la structure : **rendement brut = loyer annuel / prix d'acquisition, en %**.

- **investissement-locatif.com** (acteur professionnel de l'investissement locatif clé en main, page de référence sur le sujet) donne : *« (loyer mensuel x 12 mois) x 100 / montant d'acquisition du bien »*. La page précise explicitement que le loyer utilisé est **hors charges locatives**, et que le « montant d'acquisition » retenu **inclut les frais de notaire, honoraires et travaux**.
> Source : [investissement-locatif.com — Rendement locatif et rentabilité locative](https://www.investissement-locatif.com/rentabilite-locative.html), consulté le 04/09/2026.

- **trackstone.fr** (média spécialisé achat immobilier) formule de façon équivalente : *« Rendement locatif brut = (montant du loyer mensuel × 12) × 100 / prix d'achat »*. La page ne tranche pas explicitement si les frais de notaire doivent être ajoutés au « prix d'achat », mais signale que la rentabilité brute de la première année est souvent plus faible « car elle comporte les premières dépenses nécessaires causées par l'opération immobilière (par exemple les frais de crédit, les frais de notaire, etc.) » — une mise en garde plutôt qu'une règle de dénominateur tranchée.
> Source : [trackstone.fr — Rendement locatif brut : définition exacte et formule de calcul](https://www.trackstone.fr/blog/acheter/rendement-locatif-brut), consulté le 04/09/2026.

- **Empruntis** (courtier en financement, page dédiée au calcul de rentabilité) donne : *« (loyers annuels / prix d'acquisition) x 100 »*, avec un exemple utilisant un loyer mensuel (950 €/mois) sans distinction explicite charges comprises/hors charges, et un dénominateur décrit comme « prix d'achat + frais » sans détailler si les frais de notaire sont inclus dans l'exemple chiffré.
> Source : [Empruntis — Calculer la rentabilité pour un investissement locatif](https://www.empruntis.com/financement/investissement-locatif/rentabilite-investissement-locatif/calcul-taux-de-rentabilite/), consulté le 04/09/2026.

- **Meilleurtaux.be** (filiale belge de Meilleurtaux, guide investissement locatif) donne une formulation textuelle équivalente : *« Il suffit de diviser le montant du loyer annuel par le prix de revient du logement, puis de multiplier le résultat par 100. »* Cette page précise explicitement que le loyer est **hors charges** (« ne prend pas en compte les charges de location »), mais ne tranche pas si le « prix de revient » inclut les frais de notaire.
> Source : [Meilleurtaux.be — Calcul rendement locatif : le guide](https://www.meilleurtaux.be/pret-hypothecaire/investissement-locatif/calcul-rendement-locatif.html), consulté le 04/09/2026.

- **MAIF** (assureur, guide investissement locatif grand public) confirme la même formule et précise elle aussi que le rendement brut « ne prend pas en compte les charges de location » (loyer hors charges), sans donner de détail sur l'inclusion des frais de notaire au dénominateur.
> Source : [MAIF — Rendement locatif : la méthode pour le calculer](https://www.maif.fr/habitation/guide-investissement-locatif/rendement-locatif), consulté le 04/09/2026.

### 1.2 Ce que ces sources révèlent sur les deux points d'incertitude

1. **Loyer charges comprises ou hors charges ?** Les sources qui tranchent explicitement (investissement-locatif.com, Meilleurtaux.be, MAIF) convergent sur **loyer hors charges (charges locatives récupérables exclues)** pour le calcul du rendement *brut*. Aucune des sources consultées ne prend explicitement le loyer charges comprises pour le rendement brut — la mention « charges comprises » aperçue ailleurs (voir §2) concerne des exemples de rendement *net*, pas brut.
2. **Le dénominateur inclut-il frais de notaire/travaux ?** Une seule source tranche explicitement et sans ambiguïté : investissement-locatif.com inclut « frais de notaire, honoraires et travaux » dans le « montant d'acquisition ». Les autres sources (trackstone.fr, Empruntis, Meilleurtaux.be, MAIF) emploient des formulations plus vagues (« prix d'achat », « prix de revient ») sans trancher explicitement — ce point n'est donc **pas un consensus univoque**, même si la tendance qualitative (mise en garde de trackstone.fr sur les frais de notaire qui pèsent sur la rentabilité réelle) va dans le sens de les inclure.

---

## 2. Rendement net de charges

### 2.1 Formule et consensus de structure

Toutes les sources consultées s'accordent sur la structure : **rendement net = (loyer annuel − charges d'exploitation) / prix d'acquisition, en %**, les « charges d'exploitation » typiquement citées étant charges de copropriété non récupérables, taxe foncière, assurance (PNO), frais de gestion, et petits travaux d'entretien.

- **investissement-locatif.com** donne, pour le rendement net : *« Loyer mensuel brut × 12 mois − charges non récupérables − taxe foncière, ÷ Montant de l'acquisition + droits de mutation + frais »*. La page précise explicitement que sont **exclus** de ce calcul de base : les **intérêts d'emprunt** (non mentionnés dans le calcul du rendement net) et la **vacance locative** (« explicitement identifiée comme absente des calculs, bien que la page souligne son importance pratique »). Un rendement « net-net » est évoqué en complément mais sans formule détaillée sur cette page.
> Source : [investissement-locatif.com — Rendement locatif et rentabilité locative](https://www.investissement-locatif.com/rentabilite-locative.html), consulté le 04/09/2026.

- La page dédiée du même site au calcul de la rentabilité nette confirme et illustre par un exemple chiffré : *« Rendement net = (Loyer annuel - Charges et frais divers) / (Coût total d'achat) × 100 »*, avec un loyer d'exemple explicitement qualifié de **« 800 euros (charges comprises) »**, et des charges déduites incluant charges de copropriété non récupérables, taxe foncière, frais d'entretien, honoraires d'agent immobilier, travaux et assurance. La page qualifie elle-même cette formule de « simplifiée ».
> Source : [investissement-locatif.com — Calcul rentabilité locative nette : méthode 2026 et exemple](https://www.investissement-locatif.com/rendement/rentabilite-locative-nette-calcul.html), consulté le 04/09/2026.

- **trackstone.fr** donne une formulation cohérente : *« Rendement net = (montant du loyer mensuel × 12) × 100 − (charges locatives) / prix d'achat »*, présentée dans une section intitulée « Calcul d'un rendement net d'un investissement locatif », où l'article précise que la rentabilité nette déduit les charges (copropriété, taxe foncière, réparations, etc.) du montant total des loyers espérés.
> Source : [trackstone.fr — Rendement locatif net : définition exacte et formule de calcul](https://www.trackstone.fr/blog/acheter/rendement-locatif-net), consulté le 04/09/2026.

- **Empruntis** donne : *« [(loyers annuels - charges) / prix d'acquisition] x 100 »* pour la rentabilité nette, en précisant que seules les « charges courantes » liées à l'exploitation (taxe foncière, gestion, assurances, travaux mineurs) sont soustraites — les **intérêts d'emprunt ne sont pas mentionnés** dans la formule et ne sont donc pas déduits à ce stade.
> Source : [Empruntis — Calculer la rentabilité pour un investissement locatif](https://www.empruntis.com/financement/investissement-locatif/rentabilite-investissement-locatif/calcul-taux-de-rentabilite/), consulté le 04/09/2026.

- **Meilleurtaux.be** énumère, sans formule mathématique explicite, les éléments à retrancher pour le rendement net : taxe foncière, charges non récupérables, travaux, entretien, frais de gestion locative, garantie loyers impayés — et signale, à la différence des autres sources, que les **intérêts d'emprunt** sont pris en compte via la notion de « prix de revient ».
> Source : [Meilleurtaux.be — Calcul rendement locatif : le guide](https://www.meilleurtaux.be/pret-hypothecaire/investissement-locatif/calcul-rendement-locatif.html), consulté le 04/09/2026.

### 2.2 Réponses aux questions posées

1. **Les intérêts d'emprunt sont-ils exclus du rendement net de charges ?** Oui, dans la **grande majorité** des sources consultées (investissement-locatif.com — deux pages —, trackstone.fr, Empruntis) : le rendement net de charges est un ratio de rentabilité **locative pure**, indépendant du mode de financement, et n'intègre donc pas le coût du crédit. Meilleurtaux.be est la **seule source dissidente** trouvée, qui inclut le crédit dans un « prix de revient » élargi — à traiter comme une exception minoritaire plutôt que comme une pratique consensuelle.
2. **La vacance locative/impayés est-elle prise en compte dans le rendement net « usuel » ?** Non : investissement-locatif.com le dit explicitement (« absente des calculs » de la formule de base), et aucune des autres sources ne l'inclut dans sa formule de rendement net — la vacance locative est mentionnée par ailleurs (recherches complémentaires) comme un facteur d'ajustement optionnel et distinct (ex. « rendement brut corrigé » par un taux d'occupation), pas comme une composante de la formule standard du rendement net de charges.
3. **Les travaux/rénovation sont-ils inclus ?** Les **petits travaux d'entretien courant** apparaissent dans la liste des charges déduites chez plusieurs sources (investissement-locatif.com, trackstone.fr via « réparations », Meilleurtaux.be). Les **gros travaux de rénovation** (ex. à l'achat, avant mise en location) sont en revanche plutôt traités comme faisant partie du **prix d'acquisition au dénominateur** (cf. §1, Meilleurtaux « prix d'achat + frais de notaire + travaux ») que comme une charge annuelle récurrente au numérateur — la distinction entre les deux n'est pas toujours faite explicitement par les sources, qui emploient parfois « travaux » dans les deux sens selon le contexte (travaux d'entretien courant vs. travaux de rénovation initiaux).

---

## 3. Cash-flow (mensuel/annuel après remboursement de prêt)

### 3.1 Formule et convention de présentation « à trois étages »

- **investissement-locatif.com**, sur sa page dédiée au cash-flow, donne la formule générale : *« Cashflow = Revenus locatifs – (Mensualité de crédit + Charges + Impôts liés au bien) »*, puis la décline explicitement en **trois niveaux progressifs**, formulés ainsi par la page : le **cash-flow brut** est « loyers moins mensualité de crédit uniquement » (avant charges et impôts) ; le **cash-flow net** correspond au cash-flow brut duquel on soustrait « toutes les charges du bien » (avant impôts) ; le **cash-flow net-net** déduit en plus « l'impact de la fiscalité » (après impôts).
> Source : [investissement-locatif.com — Cashflow immobilier : les bons calculs locatifs](https://www.investissement-locatif.com/cashflow-immobilier.html), consulté le 04/09/2026.

### 3.2 Réponse aux questions posées

- **Quelle convention de présentation usuelle, avant ou après impôt ?** La convention identifiée est de présenter le cash-flow **par paliers successifs** plutôt que sous une seule forme : d'abord un cash-flow **brut** (loyers − mensualité de prêt, avant impôt et avant charges), puis un cash-flow **net** (en plus, après déduction des charges d'exploitation — taxe foncière, assurance PNO, copropriété non récupérable, frais de gestion —, mais toujours **avant impôt**), et optionnellement un cash-flow **net-net** (après impôt). La correspondance directe avec le champ produit « cash-flow après remboursement de prêt = loyer − charges − mensualité de prêt » du présent projet correspond donc au niveau **« cash-flow net »** de cette convention (avant impôt).
- **Les sources présentent-elles à la fois avant et après impôt ?** Cette source le fait explicitement en distinguant les trois niveaux, mais **ne fournit pas de formule chiffrée simple pour le niveau net-net** (l'« impact de la fiscalité » n'est pas détaillé en formule sur cette page) — cohérent avec l'absence de convention simple constatée au §4 ci-dessous.

---

## 4. Rendement net-net (après impôt) : pas de convention simple consensuelle

- **Empruntis** est la seule source, parmi celles fetchées pour cette recherche, à donner une formule chiffrée explicite pour la rentabilité **nette-nette** : *« [(loyers annuels - charges - impôts) / prix d'acquisition] x 100 »*.
> Source : [Empruntis — La rentabilité nette-nette : explications](https://www.empruntis.com/financement/investissement-locatif/rentabilite-investissement-locatif/rentabilite-nette-nette/), consulté le 04/09/2026.

- Cette formule reste cependant **structurellement creuse** : elle renvoie le calcul de l'« impôt » à la situation fiscale individuelle du bailleur (régime micro-foncier, régime réel, LMNP/LMP, dispositifs Pinel/Denormandie, déficit foncier, tranche marginale d'imposition, prélèvements sociaux…), sans qu'aucune des sources consultées ne propose de méthode de calcul standardisée et simple pour ce montant d'« impôt ». La page de cashflow d'investissement-locatif.com (§3) va dans le même sens : elle nomme le niveau « net-net » mais ne le chiffre pas par une formule, se contentant de renvoyer à « l'impact de la fiscalité ».

**Conclusion de cette section** : il **n'existe pas de convention simple et largement partagée** pour un rendement net-net ou un cash-flow net-net qui serait aussi mécanique que les formules de rendement brut/net des §1-2. Le calcul dépend directement du régime de location choisi et de la situation fiscale personnelle — exactement le point que la décision antérieure du projet identifie comme trop incertain/variable pour être modélisé finement. Cette recherche **confirme** cette décision plutôt que de la remettre en cause : aucune source ne fournit de raccourci fiscal simple qui ferait consensus au même titre que les formules brutes/nettes de charges.

---

## 5. Synthèse des sources fetchées

| Source | Rendement brut | Rendement net | Cash-flow / net-net |
|---|---|---|---|
| [investissement-locatif.com — Rentabilité locative](https://www.investissement-locatif.com/rentabilite-locative.html) | Loyer hors charges / prix incluant frais de notaire+travaux | Loyer brut − charges non récup. − taxe foncière / prix incluant frais ; exclut intérêts d'emprunt et vacance locative | — |
| [investissement-locatif.com — Rentabilité nette (calcul)](https://www.investissement-locatif.com/rendement/rentabilite-locative-nette-calcul.html) | — | (Loyer annuel charges comprises − charges et frais divers) / coût total d'achat | — |
| [investissement-locatif.com — Cashflow immobilier](https://www.investissement-locatif.com/cashflow-immobilier.html) | — | — | 3 niveaux : brut (loyers − mensualité) / net (− charges) / net-net (− fiscalité, non chiffré) |
| [trackstone.fr — Rendement locatif brut](https://www.trackstone.fr/blog/acheter/rendement-locatif-brut) | (loyer mensuel × 12 × 100) / prix d'achat | — | — |
| [trackstone.fr — Rendement locatif net](https://www.trackstone.fr/blog/acheter/rendement-locatif-net) | — | (loyer mensuel × 12 × 100 − charges locatives) / prix d'achat | — |
| [Empruntis — Calcul du taux de rentabilité](https://www.empruntis.com/financement/investissement-locatif/rentabilite-investissement-locatif/calcul-taux-de-rentabilite/) | (loyers annuels / prix d'acquisition) × 100 | (loyers annuels − charges) / prix d'acquisition × 100 ; exclut intérêts d'emprunt et vacance locative | — |
| [Empruntis — Rentabilité nette-nette](https://www.empruntis.com/financement/investissement-locatif/rentabilite-investissement-locatif/rentabilite-nette-nette/) | (qualitatif) | (qualitatif) | (loyers annuels − charges − impôts) / prix d'acquisition × 100 |
| [Meilleurtaux.be — Calcul rendement locatif](https://www.meilleurtaux.be/pret-hypothecaire/investissement-locatif/calcul-rendement-locatif.html) | Loyer annuel hors charges / prix de revient | Liste de charges dont, en exception, les intérêts d'emprunt (« prix de revient ») | — |
| [MAIF — Rendement locatif](https://www.maif.fr/habitation/guide-investissement-locatif/rendement-locatif) | Loyer annuel hors charges / prix de revient | Liste de charges (sans formule chiffrée explicite) | — |

Deux pages ont été identifiées comme candidates mais **n'ont pas pu être fetchées** (HTTP 403, contenu non accessible via l'outil de récupération) : Cafpi (« Calcul du rendement locatif : guide pour investir en immobilier ») et Foncia (« Calcul rentabilité locative 2026 : formules ») — elles ne sont donc **pas citées** dans ce document, conformément à la consigne de ne citer que des pages réellement lues.

---

## Points incertains / variabilité entre sources

1. **Loyer charges comprises ou hors charges au numérateur** : consensus **hors charges** pour le rendement *brut* chez les sources qui tranchent (investissement-locatif.com, Meilleurtaux.be, MAIF). Pour le rendement *net*, la pratique est nécessairement de partir d'un loyer « brut »/« charges comprises » puisque les charges sont ensuite explicitement déduites au numérateur — mais la terminologie exacte (« loyer hors charges » vs « loyer charges comprises » comme point de départ) varie d'un article à l'autre sans que cela change le résultat final, tant que les mêmes charges ne sont pas comptées deux fois.
2. **Frais de notaire/travaux au dénominateur** : une seule source (investissement-locatif.com) tranche explicitement en les incluant dans le « montant d'acquisition » pour le rendement brut **et** net ; les autres sources emploient des formulations plus vagues (« prix d'achat », « prix de revient ») sans lever l'ambiguïté. Ce n'est donc **pas un point de consensus univoque**, même si la tendance qualitative va dans le sens de leur inclusion pour donner une image plus réaliste de la rentabilité (mise en garde de trackstone.fr sur la sous-estimation de la rentabilité si ces frais sont ignorés).
3. **Intérêts d'emprunt dans le rendement net** : consensus majoritaire pour les **exclure** (investissement-locatif.com ×2, trackstone.fr, Empruntis), avec une **seule source dissidente** trouvée (Meilleurtaux.be) qui les inclut via un « prix de revient » élargi.
4. **Vacance locative / impayés** : consensus pour les **exclure** de la formule de base du rendement net dans toutes les sources qui abordent la question explicitement ; c'est un facteur d'ajustement complémentaire (taux d'occupation, provision séparée), pas une composante standard de la formule.
5. **Rendement/cash-flow net-net (après impôt)** : **aucune convention simple et consensuelle** trouvée. La seule formule chiffrée obtenue (Empruntis) renvoie le terme « impôts » à un calcul fiscal individuel non standardisé, ce qui la rend inutilisable telle quelle dans un moteur déterministe sans un module de fiscalité complet — exactement ce que la décision antérieure du projet écarte.
6. **Cafpi et Foncia, sites pourtant identifiés comme pertinents par la recherche, n'ont pas pu être fetchés** (erreur HTTP 403) : leur contenu n'est donc pas reflété dans ce document, en l'absence de lecture directe vérifiée.

---

## Recommandation pour le moteur de calcul déterministe

**Formules à retenir**, avec un consensus jugé suffisant pour un affichage à l'utilisateur final :

- **Rendement brut** = loyer annuel (hors charges récupérables) ÷ prix d'acquisition total, × 100. Convention à documenter explicitement dans l'aide contextuelle de l'app : préciser si le « prix d'acquisition » utilisé au dénominateur est le prix d'achat nu ou le prix total frais inclus, ce point n'étant pas tranché de façon univoque par les sources — le choix le plus défendable, aligné avec la source la plus explicite (investissement-locatif.com) et avec le champ produit déjà décidé (« prix d'acquisition total »), est d'utiliser le **prix d'acquisition total** tel que déjà modélisé dans la Ligne immobilier de l'app (qui inclut vraisemblablement frais et travaux initiaux si l'utilisateur les y a intégrés à la saisie).
- **Rendement net de charges** = (loyer annuel − charges − taxe foncière − assurance − frais de gestion) ÷ prix d'acquisition total, × 100, **en excluant explicitement les intérêts d'emprunt et la mensualité de prêt** (consensus majoritaire) ainsi que **la vacance locative/impayés** (consensus pour l'exclure de la formule de base). Ces exclusions doivent être documentées dans l'app pour éviter toute confusion avec le cash-flow, qui lui intègre la mensualité de prêt.
- **Cash-flow** = loyer − charges − taxe foncière − assurance − frais de gestion − mensualité de prêt, présenté **avant impôt** (« cash-flow net » dans la terminologie à trois étages identifiée) — c'est la convention la mieux sourcée et directement compatible avec les champs déjà modélisés dans la Ligne immobilier (loyer, charges, taxe foncière, assurance, frais de gestion, mensualité de prêt).

**Formule à écarter explicitement** :

- **Le rendement net-net (après impôt) et le cash-flow net-net** : aucune convention simple et consensuelle n'a été trouvée ; la seule formule chiffrée obtenue (Empruntis) est creuse (« − impôts » sans méthode de calcul standard) et dépend du régime de location individuel (micro-foncier, réel, LMNP/LMP, dispositifs de défiscalisation…). Ceci est cohérent avec la décision antérieure du projet de ne pas modéliser finement la fiscalité immobilière française : le moteur déterministe devrait **s'arrêter au cash-flow avant impôt et au rendement net de charges**, sans tenter d'afficher un indicateur « net-net » qui donnerait une fausse impression de précision.

**Limites à signaler dans la documentation utilisateur de l'app** :

- Le dénominateur exact (prix nu vs prix total frais inclus) et le traitement des travaux initiaux restent des choix de conception, faute de consensus univoque dans la littérature consultée — à formuler clairement dans l'aide contextuelle pour que l'utilisateur comprenne ce que représente le pourcentage affiché.
- La vacance locative n'étant pas incluse dans les formules retenues, un bien avec une vacance élevée affichera un rendement/cash-flow optimiste par rapport à la réalité vécue — un avertissement contextuel simple (sans modéliser un taux de vacance) est cohérent avec les conventions observées, qui traitent ce facteur comme un risque à mentionner plutôt qu'à intégrer systématiquement dans la formule.
