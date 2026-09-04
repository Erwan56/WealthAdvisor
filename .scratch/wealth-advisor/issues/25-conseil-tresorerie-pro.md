# Règle de conseil — trésorerie professionnelle dormante

Type: grilling
Status: resolved
Claimed-by: session_01KyTR9vL4DycQpCRNm89HNd
Blocked by: 24 (closed — unblocked)

## Question

Suite à [Recherche : seuil usuel de trésorerie de précaution pour un compte professionnel indépendant](24-recherche-precaution-compte-pro.md), qui trouve une convention (3-6 mois de charges fixes professionnelles, ~3-4 mois plausible pour un profil IT à faible risque) mais pas de chiffre officiel : faut-il ajouter une **3e règle** à [Logique de conseil et anomalies — Liquidités](14-conseil-liquidites.md) (qui exclut aujourd'hui explicitement les comptes courants pro, faute de convention adaptée) pour couvrir la trésorerie professionnelle dormante des comptes `Perso/Pro = Pro` ?

À trancher si la règle est retenue :
- Seuil exact (mois de charges fixes professionnelles) — la recherche suggère ~3-4 mois pour le profil IT concerné, sans chiffre officiel à recopier tel quel.
- Base de calcul : le modèle n'a aujourd'hui aucun champ « charges fixes professionnelles » (le champ Profil « Dépenses mensuelles courantes » couvre les dépenses de vie personnelles, pas les charges pro — voir Réponse du ticket 24). Un nouveau champ serait nécessaire si la règle est retenue — amendement à poser sur [Modèle de profil utilisateur & méthodologie de profil de risque](02-profil-risque.md) et/ou sur la Ligne liquidités elle-même.
- Faut-il exclure explicitement les provisions fiscales/sociales déjà dues (TVA, URSSAF, IS/IR) du montant évalué comme dormant, comme le recommande la recherche à l'unanimité des sources qui traitent la question — et si oui, comment ce montant de provisions est-il capturé dans le modèle (champ dédié, ou hors périmètre applicatif) ?
- Reste dans le budget 2-4 règles déjà cadré pour le socle Liquidités (cf. [Conception du moteur de conseil hybride](04-moteur-conseil-hybride.md)).

## Réponse

**3ᵉ règle retenue** : « trésorerie professionnelle dormante », qui porte le socle Liquidités à 3 règles (dans le budget 2-4 déjà cadré).

**Périmètre — un seul des deux comptes pro concernés** : en session, l'utilisateur a révélé que ses 2 comptes courants « Perso/Pro = Pro » relèvent en fait de deux structures distinctes — une **SARL** (activité IT indépendante) et une **SCI** (détention immobilière). La convention sourcée par [Recherche : seuil usuel de trésorerie de précaution pour un compte professionnel indépendant](24-recherche-precaution-compte-pro.md) vise une activité de service/freelance, pas une société de détention immobilière. **La règle s'applique donc uniquement au compte SARL** ; le compte SCI en est explicitement exclu (sa trésorerie relève d'une logique plus proche du domaine Immobilier — loyers/charges/mensualité déjà suivis par ailleurs si le bien est loué — pas de règle de conseil déterministe dédiée pour ce ticket).

**Seuil retenu** : **4 mois** de charges fixes professionnelles — haut de la fourchette basse 3-4 mois du profil « service à clientèle diversifiée » (seule source graduée par profil d'activité, Assurup), jugée la plus proche du cas IT indépendant à faible risque de l'utilisateur ; léger coussin au-delà du strict minimum vu que ce chiffre gradué n'est recoupé par aucune deuxième source à la même granularité.

**Nouveau champ nécessaire** : « Charges fixes professionnelles » porté par la **Ligne liquidités** elle-même (pas par le Profil), amendement posé sur [Modèle de données du patrimoine par domaine](01-modele-patrimoine.md) — voir détail ci-dessous. Choix motivé par le fait qu'il ne s'agit pas d'une notion « utilisateur » unique comme « Dépenses mensuelles courantes » (Profil), mais d'une charge propre à une structure pro particulière ; porter le champ sur la Ligne évite aussi de le re-router si une 2ᵉ structure de service apparaissait un jour.

**Provisions fiscales/sociales (TVA, URSSAF, IS/IR) — non modélisées pour cette règle** : la recherche est unanime sur le fait qu'il faudrait les exclure du calcul de dormance, mais capturer un montant de provisions correct nécessiterait de suivre un flux fiscal (taux, échéances) que rien dans le modèle actuel ne calcule — hors périmètre de ce ticket et de cet effort au sens large (l'application ne pilote pas la compta d'une activité indépendante). Compromis accepté : la règle peut occasionnellement sur-signaler un compte SARL comme dormant si des provisions fiscales y dorment légitimement ; à revoir si ça se révèle trop bruyant en usage réel.

**Fog surfacé en session, hors périmètre de ce ticket** : l'utilisateur a soulevé la question, plus large, de savoir si le modèle devrait à terme distinguer plusieurs entités juridiques (Profil/patrimoine séparé par structure — SARL, SCI...) plutôt qu'un Profil unique. Reconnu comme une piste plausible mais bien plus large qu'une case de ce ticket (toucherait potentiellement Profil, Objectifs, IFI, vision consolidée) — versé en fog sur la carte plutôt que tranché ici.

Décidé par grilling avec l'utilisateur.

## Amendement (voir [Modélisation multi-entités juridiques / sociétés](28-modelisation-multi-entites-juridiques.md))

Le périmètre « compte SARL uniquement, SCI exclue » se généralise désormais nativement : la règle s'applique à toute Entité de type `activité de service` (le compte SARL en est une instance) et exclut toute Entité de type `détention immobilière` (le compte SCI) — plus besoin de convention d'usage au moment de la saisie, le champ type de l'Entité porte la distinction. `Charges fixes professionnelles` migre de la Ligne liquidités vers l'Entité elle-même (voir amendement sur [Modèle de données du patrimoine par domaine](01-modele-patrimoine.md)).
