# Valorisation temps réel — Bourse — carte

## Destination

Une spec prête à implémenter pour permettre, sur les Lignes titres du Domaine Bourse (PEA/PEA-PME/CTO), de saisir un ISIN, de récupérer le cours actuel via une source de cours externe (bouton refresh global sur le dashboard Bourse), et d'afficher/historiser la performance (plus-value €/%) par Ligne et par Enveloppe — informations issues du chat du [09/09/2026] avec l'utilisateur (capture d'un relevé de courtier PEA en référence). Cet effort livre des décisions, pas le code : l'implémentation suit après, hors tickets wayfinder.

## Notes

- **Domaine** : suite directe de l'effort [WealthAdvisor — carte](../wealth-advisor/map.md) (spec initiale, PRD produit dans `PRD.md`) — graduation du point de fog « Valorisation automatisée/temps réel » de cette carte, restreinte ici au seul Domaine Bourse.
- **Glossaire domaine** : `CONTEXT.md` partagé à `../wealth-advisor/CONTEXT.md` — le tenir à jour (nouveaux termes : coût d'acquisition informational, ISIN dédié) au fur et à mesure que les tickets se résolvent.
- **Skills à consulter systématiquement** : `domain-modeling` (mise à jour du `CONTEXT.md` partagé), `grilling` pour les tickets HITL, `research` pour les tickets AFK.
- **Usage** : strictement personnel, informatif — pas de conseil réglementé (hérité de l'effort parent).
- **Décisions structurantes déjà actées lors du cadrage** (ne rouvrent pas de ticket, elles cadrent tous les tickets suivants) :
  - Périmètre : Domaine Bourse uniquement (PEA/PEA-PME/CTO) — Crypto a le même manque (pas de cours en direct) mais une source de données différente (ticker, pas ISIN) ; effort futur séparé.
  - Coût d'acquisition informational étendu aux PEA/PEA-PME (pas seulement CTO), saisi manuellement comme le PRU CTO aujourd'hui, distinct de l'usage fiscal du PRU sur CTO.
  - Champ ISIN dédié et structuré (remplace le texte libre actuel « Nom / ISIN ») ; données existantes ressaisies manuellement, pas de migration automatique.
  - Refresh : un seul bouton global en haut du dashboard Bourse, à la demande uniquement (pas de tâche planifiée) — écrit une nouvelle Valorisation par Ligne titre rafraîchie (alimente l'historique existant, ne crée pas une notion de valeur parallèle).
  - Performance affichée par Ligne et agrégée par Enveloppe (à côté de `valeur_totale`).
  - Variation journalière (delta vs clôture précédente) hors périmètre de cet effort.
  - Source de cours externe acceptée (première sortie réseau tierce de l'app) ; contrainte gratuite uniquement (pas de budget alloué à un abonnement payant).
  - Devises étrangères couvertes via une conversion légère au moment du refresh (taux du jour, stockage en EUR comme aujourd'hui) — pas d'extension du modèle de données avec un champ `devise` explicite.

## Decisions so far

- [Périmètre et destination — cours temps réel & performance Bourse](issues/01-perimetre-destination.md) — Domaine Bourse uniquement, spec-only, refresh global à la demande écrivant une Valorisation, variation journalière hors scope.
- [Extension du coût d'acquisition aux PEA/PEA-PME](issues/02-cout-acquisition-pea.md) — champ informational distinct du PRU fiscal CTO, saisie manuelle, performance affichée par Ligne + par Enveloppe.
- [Champ ISIN dédié et migration](issues/03-champ-isin.md) — remplace le texte libre « Nom / ISIN » par un ISIN structuré et validé ; ressaisie manuelle des lignes existantes.
- [Contraintes pour la source de cours externe](issues/04-contraintes-source-cours.md) — appel réseau tiers accepté, gratuit uniquement, conversion de devise légère cantonnée au refresh sans champ `devise` au modèle.
- [Recherche : source de cours gratuite par ISIN, couverture EUR + conversion devise étrangère](issues/05-recherche-source-cours.md) — source principale : endpoints JSON non officiels de Yahoo Finance (résolution ISIN + cours), source de change Frankfurter (BCE) ; fallback résolution ISIN seulement (OpenFIGI/Twelve Data), pas de fallback fiable pour le cours lui-même ; confiance haute sur CAC 40/SBF 120 et valeurs US, faible-moyenne sur la pérennité des endpoints Yahoo non officiels.
- [Modèle de données — ISIN, coût d'acquisition, contrat de l'endpoint refresh](issues/06-modele-donnees-refresh.md) — `nom_isin`→`isin` et `pru`→`cout_acquisition_unitaire` (colonne réutilisée pour toutes les Enveloppes, pas dupliquée) ; `POST /api/bourse/lines/refresh-cours` scopé à l'Entité sélectionnée, réponse `{rafraichies, echecs}` avec raisons d'échec nommées ; plus-value = `valeur_actuelle - quantite*cout_acquisition_unitaire`, tiret si donnée ou valorisation manquante ; indicateur reporting « Plus-value latente » devient portfolio-large (renommé, plus CTO-only).
- [Prototype UI — colonnes de performance et bouton refresh sur le dashboard Bourse](issues/07-prototype-ux-performance-refresh.md) — variante A retenue (colonnes inline Titre/Qté/ISIN/Coût acq./Cours/Valorisation/PV €/PV %) ; amendement structurant : le bouton « Actualiser les cours » vit au niveau du dashboard global (`App.tsx`, au-dessus du rail de Domaines) et non dans `BourseDashboard.tsx`, via un mécanisme générique d'action enregistrée par Domaine (seul Bourse l'utilise pour l'instant).

## Not yet specified

<!-- vide : plus aucun ticket ouvert — la carte est complète, voir note de clôture ci-dessous -->

## Out of scope

- **Domaine Crypto et Immobilier — valorisation temps réel** — même besoin en substance (cf. fog de [WealthAdvisor — carte](../wealth-advisor/map.md)), mais source de données et modèle différents (ticker crypto vs ISIN, estimation immobilière vs cours coté) ; effort futur séparé si redéfini.
- **Variation journalière du cours** (delta vs clôture précédente) — cf. [Périmètre et destination — cours temps réel & performance Bourse](issues/01-perimetre-destination.md), écarté du périmètre de cet effort.
- **Extension multi-devise du modèle de données** (champ `devise` explicite sur Ligne/Mouvement/Valorisation) — cf. [Contraintes pour la source de cours externe](issues/04-contraintes-source-cours.md), la conversion reste cantonnée au refresh sans toucher au modèle.
