# Périmètre et destination — cours temps réel & performance Bourse

Type: grilling
Status: resolved
Claimed-by: session_013yZgqVv9UEGzjsxyB8dDE8

## Question

L'utilisateur est en train de saisir des Lignes titres dans un compte Bourse (PEA/CTO) et souhaite, en s'appuyant sur une capture d'un relevé de courtier (quantité, prix de revient, cours actuel + variation du jour, valorisation, plus-value €/%), pouvoir renseigner un ISIN, récupérer le cours actuel automatiquement, et observer/rafraîchir la performance via un bouton refresh.

Cadrer le périmètre exact de cet effort avant de créer les tickets de détail : quel(s) Domaine(s) couvre-t-il, l'effort produit-il une spec ou du code, quelle est la portée exacte du bouton refresh, et quelles notions affichées sur la capture (variation journalière notamment) sont hors périmètre.

## Réponse

- **Périmètre domaine** : Domaine Bourse uniquement (PEA/PEA-PME/CTO). Le Domaine Crypto a le même manque (pas de cours en direct aujourd'hui, `line_crypto` = symbole + quantité sans cours) mais une source de données différente (ticker crypto, pas ISIN) — effort futur séparé, cf. [Out of scope](../map.md#out-of-scope). Immobilier/PE-SCPI et Assurance-vie/PER n'ont pas de cotation de marché directe et ne sont pas concernés.
- **Destination** : cet effort produit une spec/des décisions, pas le code — cohérent avec l'effort parent [WealthAdvisor — carte](../../wealth-advisor/map.md) qui a produit `PRD.md` puis laissé l'implémentation se faire hors tickets wayfinder. L'implémentation de cette fonctionnalité suivra normalement une fois la carte close.
- **Portée du bouton refresh** : un seul bouton global, en haut du dashboard Bourse, rafraîchissant en un clic toutes les Lignes titres (hors comptes espèces) de toutes les Enveloppes Bourse — pas de bouton par Enveloppe. À la demande uniquement, pas de tâche planifiée (l'app n'a pas d'infrastructure de job en arrière-plan et n'est pas censée tourner en continu, usage personnel sur `localhost`).
- **Effet du refresh sur l'historique** : chaque Ligne rafraîchie avec succès reçoit une nouvelle entrée dans la table `valorisations` existante (mécanisme déjà en place pour la saisie manuelle), plutôt qu'un champ « cours actuel » séparé déconnecté de l'historique. Cohérent avec le principe du PRD parent : le patrimoine est historisé dans le temps.
- **Variation journalière** (le delta type « -0,59 % » visible sur la capture, distinct de la performance vs prix de revient) : hors périmètre de cet effort — cf. [Out of scope](../map.md#out-of-scope). Suppose que la source de cours l'expose nativement (clôture précédente), fragile à garantir avec une contrainte de gratuité et un refresh à la demande plutôt que continu ; pourrait revenir en fog plus tard si la source choisie l'expose facilement.
