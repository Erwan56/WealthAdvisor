# Réserve de précaution pour imprévus d'un bien locatif — recherche sourcée

Ce document rassemble les conventions trouvées dans la littérature professionnelle de gestion locative et la presse patrimoniale française pour dimensionner une **réserve de précaution** destinée aux imprévus d'un bien immobilier locatif (ravalement, chaudière, dégât des eaux, gros entretien, vacance locative). Il alimente le champ `réserve_pour` de l'app (montant cible de réserve lié à un compte de trésorerie et à un bien), en vue d'un excédent de trésorerie investissable calculé par ligne immobilière.

**Conclusion en une phrase, développée ci-dessous : il n'existe pas de convention unique et consensuelle.** Les sources convergent surtout sur un **ordre de grandeur** — quelque part entre 0,5 % et 3 % (voire 4 % pour une maison) de la valeur du bien par an pour l'entretien/imprévus, avec une distinction récurrente selon l'âge/état du bien — plutôt que sur un chiffre unique. Une notion voisine mais distincte, chiffrée précisément par la loi, est le fonds de travaux ALUR en copropriété (minimum légal, pas une convention de réserve personnelle).

---

## 1. Convention exprimée en % de la valeur du bien par an

- **Plus que Pro** (magazine professionnel destiné aux agences immobilières et prestataires de services aux professionnels de l'immobilier) donne, dans un article sur les indicateurs de performance d'un investissement locatif, la formulation la plus explicite trouvée dans cette recherche : *« Cette réserve, généralement estimée entre 0,5 % et 1 % de la valeur du bien, anticipe les dépenses de rénovation et d'entretien. »* L'article précise explicitement la variabilité par état du bien : *« Un bien ancien nécessite souvent une provision plus importante qu'un logement récent. »*
> Source (primaire, lue directement) : [Plus que Pro — « Quels indicateurs suivre pour évaluer performance investissement locatif ? »](https://magazine.plus-que-pro.fr/services/agences-immobilieres/quels-indicateurs-suivre-pour-evaluer-performance-investissement-locatif/)

- **vivre-investir.net** (blog spécialisé investissement locatif) avance une fourchette plus large, **1 % à 3 % de la valeur d'acquisition par an** pour un appartement (soit 1 500 à 4 500 €/an pour un bien à 150 000 €), et **jusqu'à 4 % pour une maison individuelle**. L'article détaille une grille par âge du bien, seule source de cette recherche à segmenter aussi finement :

  | Type de bien | % annuel proposé |
  |---|---|
  | Appartement neuf (0-5 ans) | 0,5 % - 0,8 % |
  | Appartement récent (5-15 ans) | 1 % - 1,5 % |
  | Appartement ancien (15-30 ans) | 1,5 % - 2,5 % |
  | Maison individuelle | 2 % - 4 % |

  Le même article propose en complément une règle de provisionnement mensuel à partir des loyers perçus : **10 % à 20 % des revenus locatifs**, soit 150 à 300 €/mois pour un bien de valeur moyenne, destinés à couvrir entretien et vacance locative.
> Source (secondaire, blog spécialisé, lu directement — grille non recoupée par une autre source de cette recherche, à traiter comme un ordre de grandeur indicatif plutôt qu'un chiffre consensuel) : [vivre-investir.net — « Coût réel entretien annuel bien locatif : budget et postes clés »](https://vivre-investir.net/cout-entretien-annuel-bien-locatif/)

- **successify.fr** évoque une **« règle du 1 % »** dans un sens différent de la règle américaine du même nom (voir §1 bis ci-dessous) : *« les coûts annuels (entretien, impôts, charges) d'un bien ne devraient pas franchir la barre des 1 % de sa valeur »*. L'article précise lui-même que cette règle **n'a aucun statut légal ou réglementaire** : *« Le code de la construction et de l'habitation n'inscrit nulle part cette règle noir sur blanc »* — c'est un usage professionnel non normé, pas une norme écrite. Notez que cette version inclut taxes et charges, pas seulement l'entretien, ce qui la rend difficilement comparable telle quelle aux fourchettes ci-dessus.
> Source (secondaire, lue directement) : [Successify — « Loi du 1 % en immobilier : tout comprendre sur cette règle »](https://www.successify.fr/loi-du-1-en-immobilier-tout-comprendre-sur-cette-regle/)

### 1 bis. Attention à l'homonymie avec la « règle des 1 % » anglo-saxonne (ratio loyer/prix)

Une partie non négligeable des résultats de recherche sur « règle du 1 % immobilier » renvoie en réalité à une **règle différente**, importée des États-Unis, qui n'a rien à voir avec une réserve de précaution : le **loyer mensuel** devrait représenter au moins 1 % du **prix d'achat total** du bien (critère de rentabilité à l'achat, pas de provisionnement pour imprévus). Exemple vérifié : pour un bien à 160 000 € tout compris, le loyer mensuel visé serait ≥ 1 600 €.
> Source (primaire, lue directement) : [SeLoger — « Immobilier locatif : la règle des 1 % expliquée simplement pour savoir si un bien est rentable »](https://edito.seloger.com/conseils-d-experts/investir/immobilier-locatif-regle-1-expliquee-simplement-savoir-un-bien-rentable)

Les deux usages du terme « règle du 1 % » (ratio loyer/prix à l'achat vs. seuil de charges annuelles/entretien) coexistent dans la littérature francophone sans qu'aucune des sources consultées ne signale l'ambiguïté — un point de vigilance si l'app venait à documenter ce terme dans son aide contextuelle.

---

## 2. Convention exprimée en nombre de mois de loyer / de charges

- **Café de la Bourse** (média reconnu de finance personnelle et investissement) est cité, via une synthèse de recherche, pour une double recommandation : un **coussin de sécurité de 6 mois de dépenses** avant de se lancer dans l'investissement locatif (pour absorber vacance locative, réparations imprévues, variation de taux), et une **provision mensuelle de 2 % à 3 % du loyer** pour constituer une réserve destinée aux interventions futures.
> Source (secondaire, contenu non lu en page directe — résultat de recherche agrégé attribué à Café de la Bourse ; à vérifier par une lecture directe de la page si un contrôle plus strict est requis avant intégration ferme) : recherche web sur cafedelabourse.com, contenu agrégé.

- **creditconseildefrance.com** propose des repères chiffrés en valeur absolue plutôt qu'en pourcentage : entretien courant **500 € à 1 500 €/an pour une maison**, **300 € à 800 €/an pour un appartement** ; un « fonds d'urgence » de **2 à 3 mois de charges** ; et une épargne de précaution globale plus large de **3 à 6 mois de charges totales** (crédit inclus).
> Source (secondaire, lue directement) : [Crédit Conseil de France — « Prévisions budgétaires immobilier pour un propriétaire »](https://www.creditconseildefrance.com/actualite/budget-annuel-proprietaire-anticiper-grosses-depenses/)

- **MoneyVox**, référence de la presse finance personnelle française, publie un repère général d'épargne de précaution **non spécifique à l'investissement locatif** : 2 à 3 mois de revenus pour un salarié à revenu stable, 3 à 6 mois de revenus en cas de revenus irréguliers (indépendants). Cette page ne traite pas du cas du bailleur/investissement locatif — elle sert ici de point de comparaison sur l'ordre de grandeur générique de l'épargne de précaution en finance personnelle française, transposable par analogie mais non conçue pour ce cas d'usage.
> Source (primaire, lue directement) : [MoneyVox — « Épargne de précaution : combien garder et où la placer ? »](https://www.moneyvox.fr/livret/epargne-de-precaution.php)

- Sur la **vacance locative** spécifiquement, deux repères distincts apparaissent : un résultat de recherche agrégé évoque **2 à 3 mois de loyer par an** à provisionner pour vacance et travaux entre deux locations ; **Plus que Pro** recommande de raisonner en **taux de vacance de 5 % à 10 %** selon le marché local plutôt qu'en nombre de mois fixe (ce taux s'applique en réduction du loyer annuel espéré, pas en provision de trésorerie à part) ; et le blog **eco3min.fr** illustre par un calcul concret qu'« un mois de loyer perdu sur douze » représente déjà près de 8 % de rendement en moins, et qu'une vacance frictionnelle (rotation locataire) doit être traitée comme une **charge certaine et récurrente**, au même titre que taxe foncière ou assurance — pas comme un risque exceptionnel isolé à couvrir une fois pour toutes.
> Source (primaire, lue directement) : [Plus que Pro — idem §1](https://magazine.plus-que-pro.fr/services/agences-immobilieres/quels-indicateurs-suivre-pour-evaluer-performance-investissement-locatif/)
> Source (primaire, lue directement) : [eco3min.fr — « Vacance locative : son impact sur le rendement réel »](https://eco3min.fr/vacance-locative-impact-rendement-reel/)

---

## 3. Données empiriques ponctuelles (coût moyen constaté, non normatif)

- **Bevouac** (opérateur professionnel d'investissement locatif clé en main), citant une enquête de Flatlooker sur 5 ans, rapporte un **coût moyen des incidents techniques de 423 €/an** par bien, décomposé par poste (peinture 206 €, électricité 165 €, plomberie 166 €, dégât des eaux 154 €, entretien ménager 66 € — la somme des postes dépasse la moyenne globale, ce qui suggère des moyennes calculées sur des sous-échantillons différents plutôt qu'une décomposition additive stricte, point à noter comme imprécision de la source secondaire). L'article situe aussi la fréquence des sinistres : plomberie ~tous les ans, dégât des eaux ~tous les 2 ans, peinture ~tous les 5 ans. Bevouac ne formule **aucun pourcentage ou règle de provisionnement** — l'article reste descriptif, pas normatif.
> Source (primaire, lue directement) : [Bevouac — « Investisseur dans l'immobilier locatif : quel budget prévoir pour l'entretien de votre bien ? »](https://www.bevouac.com/blog/investisseur-dans-limmobilier-locatif-quel-budget-prevoir-pour-lentretien-de-votre-bien)

- **meilleurescpi.com** recommande de raisonner en horizon pluriannuel plutôt qu'en réserve court terme : planifier les travaux **sur un horizon de 10 à 15 ans avec un budget annuel récurrent**, et cite un repère de gros œuvre/rénovation lourde de l'ordre de **500 €/m² sur 10-15 ans** — un chiffre de planification patrimoniale à long terme, distinct d'une réserve de trésorerie immédiatement mobilisable.
> Source (primaire, lue directement) : [meilleurescpi.com — « Travaux d'entretien immobilier : préserver son capital »](https://www.meilleurescpi.com/conseils/33116-investissement-locatif-les-incontournables-travaux-d-entretien/)

---

## 4. Le fonds de travaux ALUR — anchor légal, mais pour un objet différent

Le **fonds de travaux** créé par la loi ALUR (2014), aujourd'hui codifié à l'**article 14-2-1 de la loi n° 65-557 du 10 juillet 1965**, est **obligatoire pour toutes les copropriétés** (extension aux petites copropriétés effective depuis 2025 selon le calendrier de la réforme). Il finance les travaux de la copropriété (parties communes), pas les imprévus propres au lot du bailleur.

- **Montant minimum légal** : la cotisation annuelle ne peut être inférieure à **5 % du budget prévisionnel** de la copropriété. Si l'assemblée générale a adopté un plan pluriannuel de travaux (PPPT), le montant ne peut être inférieur au **plus élevé de deux seuils : 2,5 % du montant des travaux prévus dans le plan adopté, et 5 % du budget prévisionnel**.
> Source (primaire au sens réglementaire — synthèse de l'Institut National de la Consommation, organisme public, lue directement, citant l'article de loi) : [INC — « Copropriété : le fonds de travaux en 6 questions ! »](https://www.inc-conso.fr/content/copropriete-le-fonds-de-travaux-en-6-questions)

- Ce fonds est alimenté par cotisation obligatoire calculée aux tantièmes de chaque lot, n'est **pas remboursable** en cas de revente (le montant versé reste acquis au syndicat des copropriétaires), et son objet est le gros entretien et les travaux **des parties communes** — chaudière collective, ravalement de façade d'un immeuble en copropriété, toiture, etc. Il **ne couvre pas** les imprévus propres au lot privatif du bailleur (chaudière individuelle, dégât des eaux dans le logement, vacance locative), qui restent à la charge exclusive du propriétaire.
> Source (même page, INC).

**Point méthodologique important pour l'usage de ce chiffre comme référence** : le 5 % ALUR porte sur le **budget prévisionnel annuel de la copropriété** (les charges courantes votées), pas sur la **valeur du bien**. Ce n'est donc pas directement comparable aux conventions en % de la valeur du bien du §1 — c'est un point que la littérature de finance personnelle grand public a néanmoins tendance à citer comme repère d'« ordre de grandeur légal du provisionnement travaux en France », sans toujours signaler cette différence d'assiette. À utiliser avec cette réserve si l'app le mentionne dans son aide contextuelle.

---

## 5. Synthèse des fourchettes trouvées et absence de consensus

| Angle | Fourchette trouvée | Source(s) |
|---|---|---|
| % de la valeur du bien / an (entretien + imprévus) | 0,5 % - 1 % | Plus que Pro |
| % de la valeur du bien / an, gradué par âge | 0,5 % (neuf) à 4 % (maison ancienne) | vivre-investir.net |
| % des revenus locatifs / mois provisionné | 10 % - 20 % (vivre-investir.net) ; 2 % - 3 % (Café de la Bourse, secondaire) | vivre-investir.net, Café de la Bourse |
| Coussin de sécurité avant de se lancer | 6 mois de dépenses | Café de la Bourse (secondaire) |
| Fonds d'urgence / épargne de précaution généraliste | 2-3 mois (fonds d'urgence) à 3-6 mois de charges (épargne de précaution large) | creditconseildefrance.com ; MoneyVox (généraliste, non spécifique locatif) |
| Vacance locative | 2-3 mois de loyer/an (secondaire) ; taux de vacance 5-10 % du marché (Plus que Pro) | résultats agrégés, Plus que Pro |
| Fonds de travaux copropriété (légal, parties communes) | Minimum 5 % du budget prévisionnel de la copropriété (ou 2,5 % du plan pluriannuel si plus élevé) | Loi ALUR, art. 14-2-1 loi 1965, via INC |

**Aucune de ces sources ne converge vers un chiffre unique.** Le seul point de consensus qualitatif net entre les sources qui traitent explicitement de la question (Plus que Pro, vivre-investir.net) est que **l'âge/état du bien fait varier significativement le besoin** — un bien récent nécessitant une réserve nettement plus faible qu'un bien ancien ou nécessitant travaux. Aucune source consultée ne fournit d'étude empirique large (type panel de bailleurs) pour asseoir ces chiffres ; ce sont des repères professionnels/éditoriaux, pas des résultats statistiques publiés avec méthodologie vérifiable — à la différence, par exemple, de l'étude Trinity pour le taux de retrait FIRE (cf. document `11-recherche-methodologie-fire.md`).

---

## Incertitudes ouvertes / points nécessitant un arbitrage humain

1. **Aucune source de rang comparable à une étude académique ou à un texte réglementaire n'a été trouvée pour la réserve de précaution locative elle-même** (contrairement au fonds de travaux ALUR, qui lui est un texte de loi précis). Toutes les fourchettes du §1-3 proviennent de presse professionnelle ou de blogs spécialisés, sans méthodologie de calcul publiée ni panel de données ouvert.
2. **La citation attribuée à Café de la Bourse (6 mois de dépenses ; 2-3 % du loyer/mois) n'a pas été lue en page directe** dans cette session (résultat de recherche agrégé uniquement) — à confirmer par une lecture directe de la page source si une précision plus stricte est nécessaire avant intégration ferme dans une spec produit.
3. **La grille par âge de vivre-investir.net (0,5 % à 4 % selon l'ancienneté) n'a été recoupée par aucune autre source** de cette recherche avec la même granularité — à traiter comme un seul avis éditorial illustrant la logique « plus vieux = plus cher », pas comme un chiffre validé par plusieurs praticiens indépendants.
4. **Aucune source de gestion locative professionnelle « pure players » (Foncia, Nexity, Citya, Masteos, Beanstock) n'a été trouvée citant un chiffre explicite de réserve de précaution recommandée au bailleur** dans cette recherche — ces acteurs communiquent sur l'apport à l'achat, la vacance locative en général, ou des produits d'épargne dédiés (ex. Nexity), mais pas sur un pourcentage/montant de réserve pour imprévus post-acquisition identifié dans les pages consultées.
5. **Les Echos Patrimoine n'a produit aucun résultat pertinent identifié** dans cette recherche malgré plusieurs requêtes ciblées — absence de résultat plutôt que preuve d'absence de contenu (le moteur de recherche utilisé peut ne pas indexer tout le contenu payant du site).

---

## Proposition pour l'app (à trancher humainement — dérivée de la recherche, pas une règle établie)

Étant donné l'absence de convention unique et le besoin fonctionnel de l'app (un montant cible de réserve `réserve_pour`, éditable, lié à un compte de trésorerie et à un bien, pour calculer un excédent investissable), voici une proposition de valeur par défaut ajustable, construite à partir des fourchettes les plus recoupées ci-dessus plutôt qu'inventée :

- **Défaut proposé : 1 % de la valeur du bien par an**, comme milieu de la fourchette la mieux sourcée et la plus directement lue en primaire (Plus que Pro : 0,5-1 % ; vivre-investir.net : borne basse à 0,5 % pour le neuf, jusqu'à 1,5-2,5 % pour de l'ancien). Ce chiffre a l'avantage d'être directement calculable à partir d'une donnée déjà présente dans le modèle de patrimoine de l'app (valeur du bien), sans dépendre du loyer (qui varie avec la vacance et n'est pas toujours renseigné pour un bien en jouissance personnelle).
- **Curseur d'ajustement suggéré selon l'état du bien**, en cohérence avec le seul point de consensus qualitatif net des sources : de l'ordre de **0,5 % pour un bien récent/rénové** à **2-3 % (voire plus) pour un bien ancien ou à rénover** — bornes à traiter comme indicatives, pas comme des seuils validés.
- **Alternative/complément pour la composante « vacance locative »** si l'app souhaite la isoler du poste « entretien » : un ordre de grandeur de **2 à 3 mois de loyer annuel** (ou un taux de vacance de 5-10 % appliqué au loyer attendu) revient dans plusieurs sources, cohérent avec le repère générique MoneyVox de 2-6 mois de dépenses pour une épargne de précaution des ménages.
- **Ne pas utiliser le seuil ALUR de 5 %** comme défaut direct pour `réserve_pour` : son assiette (budget prévisionnel de charges de copropriété) est différente de la valeur du bien, et son objet (parties communes) ne recouvre qu'une partie des imprévus visés par le champ (il exclut par construction tout ce qui touche au lot privatif et à la vacance locative). Il peut en revanche être mentionné dans l'aide contextuelle comme point de comparaison légal pour les biens en copropriété.
- Dans tous les cas, **exposer le paramètre comme un pourcentage éditable de la valeur du bien** (avec une valeur par défaut, pas un montant figé) semble le choix le plus fidèle à ce que montre cette recherche : une pratique répandue mais non standardisée, où le bon sens professionnel dominant est « ajuster selon l'état et l'âge du bien », pas appliquer un chiffre unique.
