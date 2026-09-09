# Extension du coût d'acquisition aux PEA/PEA-PME

Type: grilling
Status: resolved
Claimed-by: session_013yZgqVv9UEGzjsxyB8dDE8
Blocked by: 01

## Question

`PRD.md:29` et `schema.sql:128-134` (champ `pru` de `line_bourse`) sont explicites : le PRU (prix de revient moyen pondéré) n'existe que pour les Lignes d'un Enveloppe CTO, jamais PEA/PEA-PME, parce que la fiscalité PEA s'applique au niveau de l'Enveloppe et non de la Ligne — décision fiscale déjà actée dans l'effort parent.

Or la demande de l'utilisateur (et la capture de référence) porte sur une Ligne qui se lit comme un PEA, avec un prix de revient affiché à des fins de performance, pas de calcul fiscal. Faut-il amender cette règle pour permettre le suivi du coût d'acquisition sur toutes les Enveloppes Bourse, et si oui selon quel mécanisme de saisie et à quel niveau d'agrégation la performance doit-elle s'afficher ?

## Réponse

- **Champ distinct du PRU fiscal** : on introduit une notion de coût d'acquisition informational, affichée à des fins de performance sur toutes les Enveloppes Bourse (PEA/PEA-PME/CTO), sans redéfinir ni remplacer l'usage fiscal actuel du PRU sur CTO (qui reste inchangé, hors périmètre de cet effort). Le détail exact du schéma (nouveau champ vs élargissement du champ `pru` existant à tous les types d'Enveloppe) est renvoyé à [Modèle de données — ISIN, coût d'acquisition, contrat de l'endpoint refresh](06-modele-donnees-refresh.md).
- **Mécanisme de saisie** : saisie manuelle directe, dans le même formulaire que celui utilisé aujourd'hui pour le PRU CTO (`EditLigneBourseModal.tsx`) — pas de calcul automatique dérivé des Mouvements d'achat. Choix cohérent avec l'implémentation réelle actuelle : le PRU CTO est déjà une saisie directe côté `bourse.ts`, pas un calcul dérivé, malgré la formulation plus ambitieuse du PRD (`PRD.md:29`, « dérivé des Mouvements d'achat »).
- **Niveau d'agrégation de la performance** : affichée par Ligne (plus-value €/% individuelle) **et** agrégée par Enveloppe, à côté du total `valeur_totale` déjà affiché sur le dashboard Bourse (`BourseDashboard.tsx:128-146`) — simple somme une fois le coût d'acquisition disponible par Ligne, pas de nouveau calcul complexe.
