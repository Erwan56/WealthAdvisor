# Recherche : seuil usuel de trésorerie de précaution pour un compte professionnel indépendant

Type: research
Status: resolved
Claimed-by: session_01KyTR9vL4DycQpCRNm89HNd
Blocked by: 03

## Question

Suite au ticket [Logique de conseil et anomalies — Liquidités](14-conseil-liquidites.md), qui exclut explicitement les comptes courants « pro » de ses 2 règles de liquidités dormantes (celles-ci ne couvrant que les comptes personnels, faute de convention adaptée à l'activité professionnelle indépendante) : existe-t-il une convention/pratique usuelle (littérature de gestion pour indépendants/freelances/TPE, pas de vérité légale) pour déterminer le montant de trésorerie professionnelle à garder en réserve ?

Contexte utilisateur pour cadrer la recherche : activité IT indépendante, jugée à faible risque (pas de stock, pas de gros investissements engagés, faible volatilité de revenus comparée à d'autres activités indépendantes).

À rechercher :
- Convention usuelle de trésorerie de précaution pour un indépendant/freelance (ex. nombre de mois de charges professionnelles courantes, ou de facturation moyenne, ou de chiffre d'affaires).
- Dans quelle mesure la nature de l'activité (faible risque, faibles charges fixes, type service intellectuel/IT vs activité avec stock ou investissements lourds) module ce seuil.
- Provisions distinctes à considérer séparément de la réserve de précaution générale (ex. TVA à reverser, cotisations URSSAF, IS/IR à venir) — la réserve « de précaution » doit-elle exclure ces provisions déjà dues, ou les inclure dans le seuil recommandé ?
- Sources : littérature de gestion pour indépendants/freelances/TPE grand public (pas de recherche académique poussée nécessaire — usage personnel informatif, cf. Notes du [map](../map.md)).

Capturer les sources et chiffres trouvés dans `assets/24-recherche-precaution-compte-pro.md`, avec le degré de consensus/variabilité entre sources (il n'y a probablement pas de chiffre unique universel, comme pour [Recherche : seuil usuel de liquidités dormantes sur compte courant/livret](19-recherche-seuil-liquidites-dormantes.md)).

**Recommandation attendue pour [Logique de conseil et anomalies — Liquidités](14-conseil-liquidites.md)**, à valider en grilling lors d'une session ultérieure (pas tranchée par cette recherche, qui reste AFK) : une éventuelle 3e règle « trésorerie pro dormante » (toujours dans le budget 2-4 déjà cadré pour ce socle).

## Réponse

Recensement complet dans [`assets/24-recherche-precaution-compte-pro.md`](../assets/24-recherche-precaution-compte-pro.md) (sources : Hagnère Patrimoine, Assurup, Nouvelle Épargne, PP Gazette, Modulo N, Socic, Neovi, L'Expert-Comptable.com, Bpifrance Création, Cerfrance, Acasi).

- **Convention dominante** : trésorerie professionnelle de précaution = **3 à 6 mois de charges fixes professionnelles**, recoupée par 5 sources indépendantes (Hagnère Patrimoine, Assurup, Nouvelle Épargne, PP Gazette, Modulo N) — mais explicitement qualifiée d'« ordre de grandeur d'usage, pas une norme » par au moins une source, et sans aucune source officielle (URSSAF, Bpifrance) fixant de chiffre. Même niveau de solidité que le fonds de précaution personnel du ticket [Recherche : seuil usuel de liquidités dormantes sur compte courant/livret](19-recherche-seuil-liquidites-dormantes.md).
- **Modulation par nature d'activité** : aucune source ne raisonne en « stock »/« investissement lourd » comme cadré par ce ticket ; le critère réel identifié est la **volatilité des revenus et la concentration/fiabilité du portefeuille clients** (Hagnère Patrimoine, Assurup). Seule Assurup gradue un chiffre : service à clientèle diversifiée → 3-4 mois ; commerce saisonnier → 6 mois et plus (non recoupée par une 2e source à la même granularité). Un indépendant IT (service, faible saisonnalité) se rapproche du cas « service diversifié » → bas de la fourchette (~3-4 mois), mais c'est une extrapolation cohérente avec la logique des sources, pas une affirmation trouvée telle quelle.
- **Provisions (TVA, URSSAF, IS/IR)** : consensus net et le mieux sourcé des trois angles (5 sources indépendantes, aucune contradiction) — à **isoler séparément** (en % de chaque encaissement, 20-30 % le plus cité pour la micro-entreprise) et à **exclure** du calcul de la réserve de précaution générale, qui se calcule sur les charges nettes de ces provisions.
- **Point de vigilance** : chevauchement terminologique fréquent dans la littérature grand public entre trésorerie professionnelle (mois de charges pro) et épargne de précaution personnelle de l'indépendant (mois de dépenses de vie, 6-12 mois déjà documenté au ticket 19) — à garder distinct dans la conception.

**Recommandation pour [Logique de conseil et anomalies — Liquidités](14-conseil-liquidites.md)**, à valider en grilling si une 3e règle « trésorerie pro dormante » est ajoutée (pas tranchée par cette recherche, qui reste AFK) : seuil ≈ 3-4 mois de charges fixes professionnelles (bas de la fourchette 3-6, cohérent avec le profil IT à faible risque/faible saisonnalité), évalué sur les charges pro nettes des provisions fiscales/sociales déjà mises de côté séparément. Le champ Profil « Dépenses mensuelles courantes » ne convient pas tel quel (il représente des dépenses de vie personnelles, pas des charges professionnelles) — un éventuel champ distinct de charges fixes professionnelles resterait à cadrer en session si cette règle est retenue.
