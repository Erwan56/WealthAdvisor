# Recherche : méthodologie de calcul de l'indépendance financière (FIRE)

Type: research
Status: resolved
Claimed-by: session_01QHgdqVt4UM28nW12uKohYu

## Question

Suite au ticket [Lien Objectif ↔ patrimoine pour le calcul d'avancée](10-lien-objectif-patrimoine.md), la calculette d'indépendance financière/FIRE de l'écran Objectifs (voir [`assets/prototypes/09-ux-objectifs.html`](../assets/prototypes/09-ux-objectifs.html)) doit proposer des méthodes de calcul concrètes (formules, taux/multiplicateurs) pour aider à chiffrer un Objectif de type "indépendance financière", difficile à estimer autrement.

À rechercher :
- La méthode de la règle de retrait (Safe Withdrawal Rate / SWR) : origine (étude de Trinity, règle des 4 %...), formule exacte, multiplicateurs usuels (25×, 28,6× pour 3,5 %...), limites connues (durée du capital, variantes retraits fixes vs variables).
- Des méthodes alternatives couramment citées (ex. méthode du niveau de vie actuel × multiplicateur, règles plus prudentes ou spécifiques à un pays) et leurs sources de données typiques (dépenses annuelles visées vs dépenses actuelles constatées).
- Ce que ces méthodes permettent concrètement d'évaluer comme "réalisable" compte tenu d'un patrimoine donné et d'un horizon donné — de quoi éclairer le choix du multiplicateur par défaut et son caractère éditable (voir [Lien Objectif ↔ patrimoine pour le calcul d'avancée](10-lien-objectif-patrimoine.md)).
- Éventuelles considérations spécifiques au contexte fiscal français pertinentes pour le sujet (ex. fiscalité des retraits d'assurance-vie/PER après un certain âge/durée) si elles influencent la formule ou le multiplicateur — sans refaire le recensement déjà fait dans [Règles fiscales et légales françaises par domaine](03-regles-fiscales-legales.md).

Objectif de la recherche : fournir assez de matière pour trancher, dans le ticket de prototypage UI [Prototype de la calculette d'indépendance financière (FIRE)](12-prototype-calculette-fire.md), les formules exactes et les champs de saisie de la calculette.

## Résolution

Recherche sourcée complète dans [`assets/11-recherche-methodologie-fire.md`](../assets/11-recherche-methodologie-fire.md) (étude de Trinity lue intégralement ; papier de Bengen, wiki Bogleheads et papier Guyton-Klinger recoupés via sources secondaires convergentes faute d'accès direct — voir incertitudes en fin de document).

Points clés à retenir pour le ticket de prototypage :
- **Formule** : Capital cible = Dépenses annuelles × Multiplicateur, avec Multiplicateur = 1 ÷ Taux de retrait. Multiplicateurs usuels : 25× (4 %, Trinity/Bengen), 28,6× (3,5 %), 33× (3 %).
- **Trinity (1998)** teste des horizons de 15 à 30 ans seulement ; le résultat exact pour 4 % ajusté à l'inflation sur 30 ans est 95 % de succès en 100 % actions ou 50/50, pas 100 % comme le raccourci populaire le suggère parfois.
- **Multiplicateur plus prudent (28-33×)** couramment cité par la communauté FIRE francophone pour les horizons longs (40-60 ans typiques d'un départ à 35-45 ans) — extrapolation communautaire, pas un résultat direct d'étude académique testant ces horizons.
- Le multiplicateur doit rester **éditable** dans l'UI (dépend de l'horizon, des autres revenus attendus, de la tolérance au risque/legs).
- **Méthode alternative** "dépenses actuelles × multiplicateur" : même formule, donnée d'entrée = niveau de vie actuel plutôt que dépenses cibles en indépendance financière projetées séparément.
- Les stratégies de retrait variable (Guyton-Klinger, VPW) ne produisent pas de capital cible comparable au patrimoine actuel — hors périmètre de cet écran Objectifs.
- **Fiscalité française** : ni Trinity ni Bengen ne modélisent d'impôt ; le taux de retrait est donc "brut". Deux options de cadrage identifiées pour le ticket de prototypage : capital cible brut avec avertissement, ou paramètre éditable de "ponction fiscale effective" (suppose que le modèle de patrimoine sache répartir par enveloppe — non trivial).
- 6 incertitudes ouvertes documentées en fin d'asset (accès source primaire Bengen/Bogleheads/Guyton-Klinger, absence d'étude sur horizons 40-60 ans ou marché français, arbitrage brut/net non tranché) — à relire avant intégration ferme dans une spec.
