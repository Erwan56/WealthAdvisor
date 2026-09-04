# Recherche : convention de réserve de précaution pour un bien locatif

Type: research
Status: resolved
Claimed-by: session_0185HxuHgWjK4x8Rr9JYiDyJ
Blocked by: 03, 13

## Question

Pour compléter [Réserve de précaution immobilier et arbitrage liquidités ↔ investissement](13-reserve-precaution-immobilier.md) (résolu, mais avec un point de recherche laissé ouvert) : quelle est la convention usuelle en gestion locative pour dimensionner une réserve de précaution destinée aux imprévus d'un bien (ravalement, remplacement chaudière, dégât des eaux...) ?

À rechercher :
- Convention exprimée en % de la valeur du bien par an, ou en nombre de mois de loyer/charges, ou un montant forfaitaire usuel (pratique de gestion locative/syndic, littérature grand public de gestion de patrimoine).
- Variabilité selon l'ancienneté/l'état du bien si mentionnée par les sources (probable qu'il n'y ait pas de chiffre unique).
- Sources : littérature de gestion locative/patrimoniale grand public.

Capturer les sources et chiffres trouvés dans `assets/20-recherche-convention-reserve-precaution.md`. Cette recherche alimente une valeur par défaut ajustable — pas une règle stricte.

## Résolution

Recherche sourcée complète dans [`assets/20-recherche-convention-reserve-precaution.md`](../assets/20-recherche-convention-reserve-precaution.md). Pas de convention unique consensuelle trouvée — les sources professionnelles/éditoriales convergent sur un **ordre de grandeur** :

- **En % de la valeur du bien/an** : 0,5-1 % (Plus que Pro, primaire) ; grille graduée par âge de 0,5 % (neuf) à 4 % (maison ancienne) (vivre-investir.net, non recoupée).
- **En mois de dépenses/loyer** : coussin de 6 mois de dépenses avant investissement (Café de la Bourse, non lu en page directe) ; 2-3 mois de charges en fonds d'urgence, 3-6 mois en épargne de précaution large (creditconseildefrance.com) ; vacance locative 2-3 mois de loyer/an ou taux de 5-10 % (Plus que Pro, eco3min.fr).
- **Fonds de travaux ALUR** (copropriété, art. 14-2-1 loi 1965) : minimum légal de 5 % du budget prévisionnel — anchor légal réel, mais assiette (charges copropriété) et objet (parties communes) différents d'une réserve personnelle par bien ; à ne pas reprendre tel quel comme défaut.

**Proposition retenue pour la valeur par défaut ajustable de `réserve_pour`** : 1 % de la valeur du bien par an (milieu de la fourchette la mieux sourcée), avec un curseur d'ajustement indicatif de 0,5 % (bien récent/rénové) à 2-3 % (bien ancien/à rénover) selon l'état du bien. Le seuil ALUR de 5 % n'est pas repris comme défaut (assiette différente) mais peut figurer en aide contextuelle comme point de comparaison légal.

Point ouvert pour une future revue si une précision plus stricte est requise : la citation Café de la Bourse n'a pas été vérifiée en page directe (résultat agrégé uniquement).
