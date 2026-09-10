# Création d'Enveloppe sans élément obligatoire

Type: grilling
Status: resolved
Claimed-by: session_01PWX6UxecxKh82ZdKTMGDmL

## Question

La création d'une Enveloppe force aujourd'hui la saisie complète d'un premier élément, dans les 4 Domaines concernés : "Premier titre" (Bourse, `CreateEnveloppeBourseModal.tsx:96-97,148-186`), "premier support" (Assurance-vie/PER, `CreateEnveloppeAvPerModal.tsx`), "premier actif" (Crypto, `CreateEnveloppeCryptoModal.tsx`), nombre de parts (PE/SCPI, `CreateEnveloppePeScpiModal.tsx`). L'utilisateur veut pouvoir créer l'Enveloppe vide et ajouter le premier élément ensuite via le bouton "+" dédié, comme n'importe quel élément suivant.

Trancher si cette simplification s'applique uniformément aux 4 Domaines, ou s'il existe une raison de garder l'obligation sur certains (ex. PE/SCPI où l'Enveloppe elle-même pourrait ne pas avoir de sens sans au moins une part souscrite).

## Réponse

Faits vérifiés en code avant de trancher : le schéma (`server/src/db/schema.sql:100-105`) n'impose aucune contrainte NOT NULL/trigger forçant une Enveloppe non vide dans les 4 Domaines — scinder la création (Enveloppe seule, puis Ligne via le flux "+") est donc sans risque de schéma partout. Les règles de conseil et l'agrégation Dashboard gardent déjà `.length === 0` avant tout `.reduce()` — aucune division par zéro ni cas non géré trouvé. Le flux "+" existant (`CreateLigneBourseModal.tsx`, `CreateLigneAvPerModal.tsx`, `CreateLigneCryptoModal.tsx`, `CreateLigneScpiModal.tsx`) appelle déjà les mêmes helpers serveur que la création (`insertTitreLine`/`insertSupportLine`, etc. — commentés "Shared by Enveloppe creation and the add endpoint") : aucune nouvelle logique serveur n'est nécessaire, seul le flux UI change. Précédent déjà vivant : 3 des 4 Domaines (Assurance-vie/PER, Crypto, PE/SCPI) peuvent déjà atteindre 0 Ligne aujourd'hui via suppression, et les Dashboards le rendent déjà correctement ; seul Bourse ne peut pas l'atteindre aujourd'hui, la suppression de sa Ligne "compte espèces" étant explicitement bloquée.

Décisions :
1. **Simplification uniforme sur les 4 Domaines** — aucun blocage technique identifié, et l'identité au niveau Enveloppe (contrat AV/PER, fonds PE/SCPI) est déjà indépendante du premier élément dans chaque Domaine. PE/SCPI n'est pas gardé comme exception.
2. **Bourse — la Ligne "compte espèces" continue à se créer automatiquement** à la création de l'Enveloppe, indépendamment du premier titre : ce n'est pas "le premier élément" que l'utilisateur choisit de différer, mais un primitif du compte lui-même. Un Compte Bourse "vide" au sens de ce ticket reste donc vide de titres, pas vide de Lignes.
3. **État vide explicite sur le Dashboard** : une Enveloppe à 0 élément (titres/supports/actifs/parts) affiche un message dédié (ex. "Aucun titre pour l'instant — ajoutez-en un") pointant vers le bouton "+", plutôt que le rendu de liste vide actuel, non travaillé car jusqu'ici accidentel (atteint seulement par suppression).
4. **Modale de création allégée** : les champs de premier élément sont retirés des 4 modales de création (`CreateEnveloppeBourseModal.tsx`, `CreateEnveloppeAvPerModal.tsx`, `CreateEnveloppeCryptoModal.tsx`, `CreateEnveloppePeScpiModal.tsx`), qui ne portent plus que les champs propres à l'Enveloppe. Un seul chemin pour ajouter une Ligne (le flux "+"), pour le premier élément comme pour les suivants — pas de second formulaire à maintenir en synchronisation avec le premier.
5. **Glossaire `CONTEXT.md`** : définition de Enveloppe mise à jour ("zéro, une ou plusieurs Lignes" au lieu de "une ou plusieurs"), avec renvoi vers ce ticket.
