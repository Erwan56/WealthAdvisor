# Formulaire +titre Bourse — coût d'acquisition, date d'achat, retrait de la valorisation manuelle

Type: grilling
Status: resolved

## Question

`CreateLigneBourseModal.tsx:21,96` : le champ est libellé juste "Coût d'acquisition" pour PEA/PEA-PME — l'utilisateur ne sait pas si c'est un coût unitaire ou total (c'est unitaire en base, `cout_acquisition_unitaire`, mais le libellé ne le précise pas ; le libellé CTO dit "Prix de revient moyen pondéré", lui aussi implicitement unitaire mais pas explicite non plus). Il n'existe aucun champ "date d'achat". Le formulaire porte aussi "Date de la valorisation" + "Valeur actuelle" que l'utilisateur juge inutiles puisque recalculés par le refresh de cours (effort [Valorisation temps réel — Bourse — carte](../../valorisation-bourse-temps-reel/map.md)).

Trancher :
- Le libellé exact du champ coût (préciser "unitaire" partout, ou reformuler différemment).
- L'ajout d'une date d'achat — et si elle doit vivre comme un champ propre à la Ligne, ou naître d'un Mouvement d'achat (à recroiser avec [Mise à jour d'une Ligne Bourse existante — rôle du Mouvement](09-maj-ligne-bourse.md), qui traite la même question côté mise à jour).
- Le sort du champ valorisation initiale à la création : nécessaire pour l'affichage avant le premier refresh, ou supprimable si le Domaine dispose déjà du refresh de cours ?

## Answer

Fait établi en cours de grilling : le refresh-cours automatique (`POST /api/bourse/lines/refresh-cours`) ne fonctionne que si un ISIN valide est renseigné — sans ISIN, ou avant le premier refresh réussi, seule une saisie manuelle peut établir `valeur_actuelle`. Le glossaire (`CONTEXT.md`) confirme par ailleurs que `cout_acquisition_unitaire` est déjà un champ saisi manuellement, jamais dérivé des Mouvements — la date d'achat suit la même logique et n'a donc pas besoin d'être recroisée avec le ticket 09 (qui porte sur les achats/ventes *ultérieurs*, une fois le titre déjà en portefeuille, pas sur la position initiale).

Décisions :
1. **Libellé du coût** : "Coût d'acquisition unitaire" (PEA/PEA-PME) et "Prix de revient moyen pondéré unitaire" (CTO) — le mot "unitaire" ajouté partout, aligné sur le terme déjà présent dans le glossaire.
2. **"Coût d'acquisition unitaire" devient obligatoire** à la création (optionnel aujourd'hui) — il est désormais la seule base de `valeur_actuelle`, un champ vide donnerait un "0 €" trompeur.
3. **Nouveau champ "Date d'achat"**, manuel sur la Ligne, purement informationnel pour l'instant (aucune règle de conseil n'en dépend) — remplace "Date de la valorisation" : un seul champ date à la création. Éditable ensuite dans "Modifier le titre" (EditLigneBourseModal), comme libellé/ISIN/quantité/coût.
4. **"Valeur actuelle" disparaît du formulaire de création.** `valeur_actuelle` est désormais toujours dérivée de quantité × coût d'acquisition unitaire, et la première Valorisation est enregistrée à la Date d'achat. Si la valeur réelle diverge déjà à la création (position ancienne rachetée plus cher/moins cher depuis), l'utilisateur ajoute une nouvelle entrée via le journal existant (`BourseLigneJournal.tsx`, POST `/lines/:id/valorisations`) juste après création — mécanisme déjà en place, inchangé par cette décision.

Migration des Lignes déjà saisies (pas de "date d'achat" existante, `valeur_actuelle` actuelle qui peut diverger du calcul quantité × coût) : souci d'implémentation, pas de cadrage (cf. Notes de la carte).
